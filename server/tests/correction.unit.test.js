// Pure-function tests for the correction rules (no database needed).
jest.mock('../models/BirthApplication');
jest.mock('../models/Hospital');
jest.mock('../services/audit.service', () => ({ log: jest.fn() }));
jest.mock('../services/notification.service', () => ({ notify: jest.fn() }));
jest.mock('../services/application.service', () => ({ findDuplicates: jest.fn(), scopeFilter: jest.fn(), getApplication: jest.fn() }));

const { planCorrection, planDocuments } = require('../services/correction.service');
const v = require('../validators/application.validators');

const app = () => ({
  child: { firstName: 'Aarav', middleName: 'K', lastName: 'Sharma', fullName: 'Aarav K Sharma', dateOfBirth: new Date('2026-03-14T00:00:00Z'), timeOfBirth: '09:30', gender: 'MALE', birthWeightKg: 3.2, birthPlace: 'City Care' },
  parents: { fatherName: 'Raj Sharma', motherName: 'Priya Sharma', guardianName: 'Raj Sharma', guardianPhone: '9876543210', address: '12 MG Road' },
  doctorName: 'Dr. Mehta',
  documents: [{ kind: 'HOSPITAL_DOCUMENT', storedName: 'old-hosp', originalName: 'a.pdf' }, { kind: 'PARENT_ID', storedName: 'old-id', originalName: 'id.pdf' }],
});
const file = (name, storedName) => ({ originalname: name, filename: storedName, mimetype: 'application/pdf', size: 100 });

describe('planCorrection', () => {
  it('hospital: updates only changed fields and recomputes full name', () => {
    const r = planCorrection(app(), { firstName: 'Aarush', lastName: 'Sharma', birthWeightKg: 3.2 }, 'HOSPITAL');
    expect(r.changed).toEqual(['firstName']);
    expect(r.$set).toEqual({ 'child.firstName': 'Aarush', 'child.fullName': 'Aarush K Sharma' });
  });

  it('hospital: unchanged date of birth is not treated as a change (Date vs Date)', () => {
    const r = planCorrection(app(), { dateOfBirth: new Date('2026-03-14T00:00:00Z') }, 'HOSPITAL');
    expect(r.changed).toEqual([]);
  });

  it('citizen: cannot change child data even if the field is sent', () => {
    const r = planCorrection(app(), { firstName: 'Hacked', gender: 'FEMALE', doctorName: 'Someone', motherName: 'Priya R Sharma' }, 'USER');
    expect(r.changed).toEqual(['motherName']);
    expect(r.$set).toEqual({ 'parents.motherName': 'Priya R Sharma' });
  });

  it('maps parentAddress to parents.address', () => {
    expect(planCorrection(app(), { parentAddress: '99 New Street' }, 'HOSPITAL').$set).toEqual({ 'parents.address': '99 New Street' });
  });

  it('unknown roles can change nothing', () => {
    expect(planCorrection(app(), { firstName: 'X' }, 'MUNICIPAL_OFFICER').changed).toEqual([]);
  });
});

describe('planDocuments', () => {
  it('replaces the document of the same kind and reports the old one for deletion', () => {
    const r = planDocuments(app(), { hospitalDocument: [file('new.pdf', 'new-hosp')] }, 'HOSPITAL');
    expect(r.documents.map((d) => d.storedName).sort()).toEqual(['new-hosp', 'old-id']);
    expect(r.replaced.map((d) => d.storedName)).toEqual(['old-hosp']);
    expect(r.hasNew).toBe(true);
  });

  it('keeps everything when no file is uploaded', () => {
    const r = planDocuments(app(), {}, 'USER');
    expect(r.documents).toHaveLength(2);
    expect(r.hasNew).toBe(false);
  });

  it('citizen cannot replace the hospital document', () => {
    let err;
    try { planDocuments(app(), { hospitalDocument: [file('x.pdf', 'x')] }, 'USER'); } catch (e) { err = e; }
    expect(err.statusCode).toBe(422);
    expect(err.errors[0]).toMatchObject({ field: 'hospitalDocument', message: expect.stringContaining('not allowed') });
  });
});

describe('correction validators', () => {
  it('hospital schema accepts a partial update and strips non-editable fields', () => {
    const r = v.hospitalCorrection.safeParse({ birthWeightKg: '3.4', hospitalRegistrationNumber: 'OTHER-1', maskedReference: 'XXXX-XXXX-1234' });
    expect(r.success).toBe(true);
    expect(r.data.birthWeightKg).toBe(3.4);
    expect(r.data.hospitalRegistrationNumber).toBeUndefined();
    expect(r.data.maskedReference).toBeUndefined();
  });
  it('still validates what is provided', () => {
    const r = v.hospitalCorrection.safeParse({ dateOfBirth: '2999-01-01', guardianPhone: '12' });
    expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(['dateOfBirth', 'guardianPhone']);
  });
  it('citizen schema drops child fields entirely', () => {
    const r = v.citizenCorrection.safeParse({ firstName: 'Hacked', fatherName: 'New Father' });
    expect(r.success).toBe(true);
    expect(r.data.firstName).toBeUndefined();
    expect(r.data.fatherName).toBe('New Father');
  });
  it('blank optional fields are treated as not provided', () => {
    expect(v.hospitalCorrection.safeParse({ middleName: '', note: '' }).data).toEqual({});
  });
});
