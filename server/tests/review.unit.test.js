// Unit tests for the review state machine. The Mongoose model is mocked, so no database is needed.
jest.mock('../models/BirthApplication');
jest.mock('../services/audit.service', () => ({ log: jest.fn().mockResolvedValue() }));
jest.mock('../services/notification.service', () => ({ notify: jest.fn().mockResolvedValue() }));
jest.mock('../services/certificate.service', () => ({ issueCertificate: jest.fn().mockResolvedValue({ certificateNumber: 'CERT-2026-000001' }) }));
jest.mock('../services/application.service', () => ({ getApplication: jest.fn().mockResolvedValue({ ok: true }) }));

const BirthApplication = require('../models/BirthApplication');
const { notify } = require('../services/notification.service');
const audit = require('../services/audit.service');
const { issueCertificate } = require('../services/certificate.service');
const review = require('../services/review.service');

const officer = { _id: 'off1', name: 'Officer One', role: 'MUNICIPAL_OFFICER' };
const req = { user: officer, ip: '127.0.0.1' };
const FULL = { childInfo: true, parentInfo: true, hospitalInfo: true, documents: true, biometric: true, identity: true, noDuplicate: true };
const found = (doc) => ({ select: jest.fn().mockResolvedValue(doc) });
const app = (over = {}) => ({ _id: 'a1', applicationId: 'APP-2026-000001', citizen: 'c1', submittedBy: 'h1', status: 'UNDER_REVIEW', checklist: FULL, ...over });

beforeEach(() => jest.clearAllMocks());

describe('start review', () => {
  it('moves PENDING to UNDER_REVIEW, audits and notifies citizen and hospital', async () => {
    BirthApplication.findById.mockReturnValue(found(app({ status: 'PENDING' })));
    BirthApplication.findOneAndUpdate.mockResolvedValue(app({ status: 'UNDER_REVIEW' }));
    await review.startOrUpdateReview(req, 'a1');
    const [filter, update] = BirthApplication.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: 'a1', status: 'PENDING' }); // atomic guard
    expect(update.$set.status).toBe('UNDER_REVIEW');
    expect(update.$push.history.actorName).toBe('Officer One');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'APPLICATION_REVIEW' }));
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it('refuses to review a finished application', async () => {
    BirthApplication.findById.mockReturnValue(found(app({ status: 'APPROVED' })));
    await expect(review.startOrUpdateReview(req, 'a1')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('only writes known checklist keys while UNDER_REVIEW', async () => {
    BirthApplication.findById.mockReturnValue(found(app()));
    await review.startOrUpdateReview(req, 'a1', { documents: true });
    expect(BirthApplication.updateOne).toHaveBeenCalledWith({ _id: 'a1', status: 'UNDER_REVIEW' }, { $set: { 'checklist.documents': true } });
  });
});

describe('approve', () => {
  it('lists every unticked checklist item and does not change status', async () => {
    BirthApplication.findById.mockReturnValue(found(app({ checklist: { ...FULL, documents: false, noDuplicate: false } })));
    await expect(review.approve(req, 'a1')).rejects.toMatchObject({
      statusCode: 422,
      errors: [{ field: 'checklist.documents' }, { field: 'checklist.noDuplicate' }],
    });
    expect(BirthApplication.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('requires the review to have started', async () => {
    BirthApplication.findById.mockReturnValue(found(app({ status: 'PENDING' })));
    await expect(review.approve(req, 'a1')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('approves, audits and notifies when the checklist is complete', async () => {
    BirthApplication.findById.mockReturnValue(found(app()));
    BirthApplication.findOneAndUpdate.mockResolvedValue(app({ status: 'APPROVED' }));
    await review.approve(req, 'a1');
    expect(BirthApplication.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: 'a1', status: 'UNDER_REVIEW' });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'APPLICATION_APPROVED' }));
    expect(notify).toHaveBeenCalledTimes(2);
    expect(issueCertificate).toHaveBeenCalledWith('a1', officer, req);
  });

  it('keeps the approval and flags the failure if certificate generation fails', async () => {
    BirthApplication.findById.mockReturnValue(found(app()));
    BirthApplication.findOneAndUpdate.mockResolvedValue(app({ status: 'APPROVED' }));
    issueCertificate.mockRejectedValueOnce(new Error('disk full'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const out = await review.approve(req, 'a1');
    expect(out.certificateError).toMatch(/retry/i);
    expect(BirthApplication.findOneAndUpdate).toHaveBeenCalledTimes(1); // status stays APPROVED, not rolled back
  });

  it('second officer losing the race gets a 409 naming the current status', async () => {
    BirthApplication.findById
      .mockReturnValueOnce(found(app()))                       // pre-check passes
      .mockReturnValueOnce(found(app({ status: 'REJECTED' }))); // but someone else already decided
    BirthApplication.findOneAndUpdate.mockResolvedValue(null);
    await expect(review.approve(req, 'a1')).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('REJECTED') });
    expect(notify).not.toHaveBeenCalled();
  });
});

describe('reject / request resubmission', () => {
  it('stores the rejection reason and notifies with it', async () => {
    BirthApplication.findOneAndUpdate.mockResolvedValue(app({ status: 'REJECTED' }));
    await review.reject(req, 'a1', 'Documents are illegible');
    expect(BirthApplication.findOneAndUpdate.mock.calls[0][1].$set.rejectionReason).toBe('Documents are illegible');
    expect(notify.mock.calls[0][1].message).toContain('Documents are illegible');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'APPLICATION_REJECTED' }));
  });

  it('stores resubmission comments', async () => {
    BirthApplication.findOneAndUpdate.mockResolvedValue(app({ status: 'RESUBMISSION_REQUIRED' }));
    await review.requestResubmission(req, 'a1', 'Mother name mismatch on ID');
    expect(BirthApplication.findOneAndUpdate.mock.calls[0][1].$set.resubmissionReason).toBe('Mother name mismatch on ID');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'APPLICATION_RESUBMISSION_REQUESTED' }));
  });

  it('cannot reject an application that is still PENDING', async () => {
    BirthApplication.findOneAndUpdate.mockResolvedValue(null);
    BirthApplication.findById.mockReturnValue(found(app({ status: 'PENDING' })));
    await expect(review.reject(req, 'a1', 'Not valid at all here')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('404s for an unknown application', async () => {
    BirthApplication.findOneAndUpdate.mockResolvedValue(null);
    BirthApplication.findById.mockReturnValue(found(null));
    await expect(review.reject(req, 'zzz', 'A valid long reason')).rejects.toMatchObject({ statusCode: 404 });
  });
});
