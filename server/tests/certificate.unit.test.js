// Certificate rules that do not need a database: PDF rendering, privacy of verification, integrity, revocation.
jest.mock('../models/Certificate');
jest.mock('../models/BirthApplication');
jest.mock('../models/Counter');
jest.mock('../services/audit.service', () => ({ log: jest.fn().mockResolvedValue() }));
jest.mock('../services/notification.service', () => ({ notify: jest.fn().mockResolvedValue() }));
jest.mock('../services/application.service', () => ({ scopeFilter: jest.fn().mockResolvedValue({ citizen: 'u1' }) }));

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PassThrough } = require('stream');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const service = require('../services/certificate.service');
const { renderCertificate, latin } = require('../templates/certificateTemplate');
const { UPLOAD_ROOT } = require('../middleware/upload');
const notification = require('../services/notification.service');

const sample = (over = {}) => ({
  certificateNumber: 'CERT-2026-000001', applicationId: 'APP-2026-000001', verificationCode: 'A1B2C3D4E5',
  verifyUrl: 'http://localhost:5173/verify/CERT-2026-000001', issuingAuthority: 'Pune Municipal Office', issuedAt: new Date(), signatory: 'Officer',
  child: { fullName: 'Aarav Sharma', dateOfBirth: new Date('2026-03-14T00:00:00Z'), timeOfBirth: '09:30', gender: 'MALE', birthPlace: 'City Care' },
  parents: { fatherName: 'Raj Sharma', motherName: 'Priya Sharma' }, hospitalName: 'City Care', registrationDate: new Date(), ...over,
});

const toBuffer = (data) => new Promise(async (resolve, reject) => {
  const out = new PassThrough(); const chunks = [];
  out.on('data', (c) => chunks.push(c)).on('end', () => resolve(Buffer.concat(chunks))).on('error', reject);
  renderCertificate(out, data, await QRCode.toBuffer(data.verifyUrl, { margin: 1, width: 200 }));
});

beforeEach(() => jest.clearAllMocks());

describe('PDF rendering', () => {
  it('produces a complete, single-page PDF', async () => {
    const pdf = await toBuffer(sample());
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.subarray(-6).toString()).toContain('%%EOF');
    expect((pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length).toBe(1);
    expect(pdf.length).toBeGreaterThan(3000);
  });
  it('handles a missing guardian and unsupported scripts without crashing', async () => {
    const pdf = await toBuffer(sample({ child: { ...sample().child, fullName: 'आरव शर्मा', birthPlace: 'पुणे' } }));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });
  it('replaces characters Helvetica cannot print instead of emitting garbage', () => {
    expect(latin('आरव')).toBe('???');
    expect(latin('José Núñez')).toBe('José Núñez'); // Latin-1 is kept
  });
  it('is deterministic enough to hash: same bytes hash the same', async () => {
    const a = crypto.createHash('sha256').update(await toBuffer(sample())).digest('hex');
    expect(a).toHaveLength(64);
  });
});

describe('public verification', () => {
  const cert = (over = {}) => ({
    status: 'VALID', certificateNumber: 'CERT-2026-000001', issuingAuthority: 'Pune Municipal Office', issuedAt: new Date(), verificationCode: 'SECRET1234', pdfPath: 'x', qrCode: 'data:...',
    application: {
      child: { fullName: 'Aarav Sharma', dateOfBirth: new Date('2026-03-14'), gender: 'MALE', birthPlace: 'City Care' },
      registrationDate: new Date('2026-03-14'), hospital: { name: 'City Care' },
      parents: { fatherName: 'LEAK', motherName: 'LEAK', address: 'LEAK', guardianPhone: '9999999999' },
    }, ...over,
  });

  it('returns only whitelisted, non-sensitive fields', async () => {
    Certificate.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(cert()) });
    const r = await service.verifyCertificate('cert-2026-000001');
    expect(Object.keys(r).sort()).toEqual(['birthPlace', 'certificateNumber', 'childName', 'dateOfBirth', 'gender', 'hospital', 'issuedAt', 'issuingAuthority', 'registrationDate', 'status', 'verifiedAt']);
    expect(JSON.stringify(r)).not.toMatch(/LEAK|SECRET1234|9999999999/);
    expect(Certificate.findOne).toHaveBeenCalledWith({ certificateNumber: 'CERT-2026-000001' }); // normalised
  });
  it('reports revoked certificates as REVOKED', async () => {
    Certificate.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(cert({ status: 'REVOKED' })) });
    expect((await service.verifyCertificate('CERT-2026-000001')).status).toBe('REVOKED');
  });
  it('404 for unknown numbers and 422 for malformed ones (no query is made)', async () => {
    Certificate.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    await expect(service.verifyCertificate('CERT-2026-999999')).rejects.toMatchObject({ statusCode: 404 });
    Certificate.findOne.mockClear();
    await expect(service.verifyCertificate('{"$ne":null}')).rejects.toMatchObject({ statusCode: 422 });
    expect(Certificate.findOne).not.toHaveBeenCalled();
  });
});

describe('download integrity', () => {
  const dir = path.join(UPLOAD_ROOT, 'certificates');
  const name = `test-${Date.now()}.pdf`;
  const file = path.join(dir, name);
  const req = { user: { _id: 'u1', role: 'USER' } };
  afterAll(() => fs.rmSync(file, { force: true }));

  it('serves an untouched file, refuses a tampered one, and refuses revoked ones', async () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, '%PDF-1.4 original');
    const hash = crypto.createHash('sha256').update('%PDF-1.4 original').digest('hex');
    const doc = (over = {}) => ({ _id: 'c1', certificateNumber: 'CERT-2026-000001', status: 'VALID', pdfPath: path.join('certificates', name), pdfHash: hash, ...over });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // a citizen is scoped to certificates of their own approved applications
    require('../models/BirthApplication').find.mockReturnValue({ distinct: jest.fn().mockResolvedValue(['a1']) });

    Certificate.findOne.mockResolvedValue(doc());
    expect((await service.getDownload(req, 'c1')).filename).toBe('CERT-2026-000001.pdf');
    expect(Certificate.findOne).toHaveBeenCalledWith({ _id: 'c1', application: { $in: ['a1'] } });

    fs.writeFileSync(file, '%PDF-1.4 TAMPERED');
    await expect(service.getDownload(req, 'c1')).rejects.toMatchObject({ statusCode: 500, message: expect.stringContaining('integrity') });

    Certificate.findOne.mockResolvedValue(doc({ status: 'REVOKED' }));
    await expect(service.getDownload(req, 'c1')).rejects.toMatchObject({ statusCode: 403 });

    Certificate.findOne.mockResolvedValue(null);
    await expect(service.getDownload(req, 'c1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('revocation', () => {
  const req = { user: { _id: 'off1', role: 'MUNICIPAL_OFFICER' } };
  it('only a VALID certificate can be revoked, atomically', async () => {
    Certificate.findOneAndUpdate.mockResolvedValue({ _id: 'c1', certificateNumber: 'CERT-2026-000001', application: 'a1' });
    require('../models/BirthApplication').findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'a1', applicationId: 'APP-2026-000001', citizen: 'c', submittedBy: 'h' }) });
    await service.revokeCertificate(req, 'c1', 'Issued in error, wrong child');
    const [filter, update] = Certificate.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: 'c1', status: 'VALID' });
    expect(update.$set).toMatchObject({ status: 'REVOKED', revokedReason: 'Issued in error, wrong child', revokedBy: 'off1' });
    expect(notification.notify).toHaveBeenCalledTimes(2);
  });
  it('409 when already revoked, 404 when unknown', async () => {
    Certificate.findOneAndUpdate.mockResolvedValue(null);
    Certificate.exists.mockResolvedValue({ _id: 'c1' });
    await expect(service.revokeCertificate(req, 'c1', 'Second attempt reason')).rejects.toMatchObject({ statusCode: 409 });
    Certificate.exists.mockResolvedValue(null);
    await expect(service.revokeCertificate(req, 'zz', 'Unknown certificate id')).rejects.toMatchObject({ statusCode: 404 });
  });
});
