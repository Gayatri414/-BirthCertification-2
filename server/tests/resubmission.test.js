const request = require('supertest');
const app = require('../app');
const h = require('./helpers');
const Hospital = require('../models/Hospital');
const BirthApplication = require('../models/BirthApplication');
const Notification = require('../models/Notification');
const { ROLES } = require('../constants');

const PDF = Buffer.from('%PDF-1.4\n%demo');
const PASSWORD = 'Passw0rd@123';

beforeAll(h.connect);
afterAll(h.disconnect);
beforeEach(h.clear);

async function login(email, role) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: PASSWORD, role });
  return agent;
}

async function setup() {
  const hUser = await h.createUser(ROLES.HOSPITAL, { email: 'hosp@example.com' });
  const hospital = await Hospital.create({ user: hUser._id, name: 'City Care', registrationNumber: 'MH-HOSP-1001', email: hUser.email, phone: '9123456780', address: '5 FC Road, Pune', authorizedPerson: 'Dr. Mehta' });
  await h.createUser(ROLES.MUNICIPAL_OFFICER, { email: 'officer@example.com' });
  const hosp = await login('hosp@example.com', 'HOSPITAL');
  const officer = await login('officer@example.com', 'MUNICIPAL_OFFICER');

  let r = hosp.post('/api/hospital/registrations');
  const f = { firstName: 'Aarav', lastName: 'Sharma', dateOfBirth: '2026-03-14', timeOfBirth: '09:30', gender: 'MALE', birthWeightKg: '3.2', birthPlace: 'City Care', fatherName: 'Raj Sharma', motherName: 'Priya Sharma', guardianPhone: '9876543210', parentAddress: '12 MG Road, Pune', doctorName: 'Dr. Mehta', hospitalRegistrationNumber: hospital.registrationNumber, parentEmail: 'priya@example.com' };
  Object.entries(f).forEach(([k, v]) => { r = r.field(k, v); });
  const created = await r.attach('hospitalDocument', PDF, { filename: 'p.pdf', contentType: 'application/pdf' });
  const id = created.body.data.application._id;
  return { hosp, officer, id, hospital };
}

const requestCorrection = async (officer, id) => {
  await officer.patch(`/api/municipal/applications/${id}/review`).send({ checklist: { childInfo: true, parentInfo: true } });
  return officer.patch(`/api/municipal/applications/${id}/request-resubmission`).send({ comments: 'Mother name does not match the ID' });
};

describe('resubmission loop', () => {
  it('RESUBMISSION_REQUIRED -> corrected -> PENDING, with history, reset checklist and officer notified', async () => {
    const { hosp, officer, id } = await setup();
    expect((await requestCorrection(officer, id)).body.data.status).toBe('RESUBMISSION_REQUIRED');

    const res = await hosp.patch(`/api/applications/${id}/resubmit`).field('motherName', 'Priya R Sharma').field('note', 'Fixed as per ID');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.parents.motherName).toBe('Priya R Sharma');

    const stored = await BirthApplication.findById(id);
    expect(stored.resubmissionCount).toBe(1);
    expect(stored.checklist.childInfo).toBe(false); // officer must verify again
    expect(stored.history.map((x) => x.status)).toEqual(['PENDING', 'UNDER_REVIEW', 'RESUBMISSION_REQUIRED', 'PENDING']);
    expect(stored.history.at(-1).comment).toContain('motherName');
    expect(await Notification.countDocuments({ type: 'RESUBMITTED' })).toBeGreaterThan(0);
  });

  it('the officer can review it again after resubmission', async () => {
    const { hosp, officer, id } = await setup();
    await requestCorrection(officer, id);
    await hosp.patch(`/api/applications/${id}/resubmit`).field('note', 'Documents re-checked');
    expect((await officer.patch(`/api/municipal/applications/${id}/review`).send({})).body.data.status).toBe('UNDER_REVIEW');
  });

  it('draft save keeps the status and does not count as a resubmission', async () => {
    const { hosp, officer, id } = await setup();
    await requestCorrection(officer, id);
    const res = await hosp.patch(`/api/applications/${id}`).field('birthWeightKg', '3.4');
    expect(res.body.data.status).toBe('RESUBMISSION_REQUIRED');
    expect((await BirthApplication.findById(id)).resubmissionCount).toBe(0);
  });

  it('rejects corrections when nothing was changed', async () => {
    const { hosp, officer, id } = await setup();
    await requestCorrection(officer, id);
    expect((await hosp.patch(`/api/applications/${id}/resubmit`)).status).toBe(422);
  });

  it('cannot correct an application that is not awaiting resubmission', async () => {
    const { hosp, id } = await setup();
    expect((await hosp.patch(`/api/applications/${id}/resubmit`).field('note', 'hi there')).status).toBe(409);
  });

  it('replaces a document and a second resubmit attempt is refused', async () => {
    const { hosp, officer, id } = await setup();
    await requestCorrection(officer, id);
    const res = await hosp.patch(`/api/applications/${id}/resubmit`).field('note', 'new scan').attach('hospitalDocument', PDF, { filename: 'new.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(200);
    expect(res.body.data.documents).toHaveLength(1);
    expect(res.body.data.documents[0].originalName).toBe('new.pdf');
    expect((await hosp.patch(`/api/applications/${id}/resubmit`).field('note', 'again please')).status).toBe(409);
  });

  it("another hospital cannot touch it (404), and officers cannot use the correction route (403)", async () => {
    const { officer, id } = await setup();
    const other = await h.createUser(ROLES.HOSPITAL, { email: 'other@example.com' });
    await Hospital.create({ user: other._id, name: 'Other', registrationNumber: 'MH-HOSP-2002', email: other.email, phone: '9123456781', address: '9 JM Road, Pune', authorizedPerson: 'Dr. X' });
    const otherAgent = await login('other@example.com', 'HOSPITAL');
    await requestCorrection(officer, id);
    expect((await otherAgent.patch(`/api/applications/${id}/resubmit`).field('note', 'not mine really')).status).toBe(404);
    expect((await officer.patch(`/api/applications/${id}/resubmit`).field('note', 'officer try')).status).toBe(403);
  });

  it('the linked citizen can fix parent details but not child details', async () => {
    const { officer, id } = await setup();
    await requestCorrection(officer, id);
    const citizen = await h.createUser(ROLES.USER, { email: 'priya@example.com' }).catch(() => null); // exists: created by the hospital
    const cAgent = request.agent(app);
    // account was created with a temporary password, so reset it for the test
    const User = require('../models/User');
    const u = await User.findOne({ email: 'priya@example.com' }).select('+password');
    u.password = PASSWORD; await u.save();
    await cAgent.post('/api/auth/login').send({ email: 'priya@example.com', password: PASSWORD, role: 'USER' });

    const res = await cAgent.patch(`/api/applications/${id}/resubmit`).field('motherName', 'Priya R Sharma').field('firstName', 'Hacked');
    expect(res.status).toBe(200);
    expect(res.body.data.parents.motherName).toBe('Priya R Sharma');
    expect(res.body.data.child.firstName).toBe('Aarav'); // child data untouched
    expect(citizen === null || citizen).toBeDefined();
  });
});
