const request = require('supertest');
const app = require('../app');
const h = require('./helpers');
const { outbox } = require('../services/mail.service');
const BirthApplication = require('../models/BirthApplication');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { ROLES } = require('../constants');

const PDF = Buffer.from('%PDF-1.4\n%demo');
const PASSWORD = 'Passw0rd@123';

beforeAll(h.connect);
afterAll(h.disconnect);
beforeEach(async () => { await h.clear(); outbox.length = 0; });

async function hospitalAgent(n = 1) {
  const user = await h.createUser(ROLES.HOSPITAL, { email: `hosp${n}@example.com` });
  const hospital = await Hospital.create({
    user: user._id, name: `Hospital ${n}`, registrationNumber: `MH-HOSP-100${n}`, email: user.email,
    phone: '9123456780', address: '5 FC Road, Pune', authorizedPerson: 'Dr. Mehta',
  });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD, role: 'HOSPITAL' });
  return { agent, user, hospital };
}

const fields = (hospital, over = {}) => ({
  firstName: 'Aarav', lastName: 'Sharma', dateOfBirth: '2026-03-14', timeOfBirth: '09:30', gender: 'MALE',
  birthWeightKg: '3.2', birthPlace: hospital.name, fatherName: 'Raj Sharma', motherName: 'Priya Sharma',
  guardianPhone: '9876543210', parentAddress: '12 MG Road, Pune', doctorName: 'Dr. Mehta',
  hospitalRegistrationNumber: hospital.registrationNumber, parentEmail: 'priya@example.com', ...over,
});

const submit = (agent, f, withDoc = true) => {
  let r = agent.post('/api/hospital/registrations');
  Object.entries(f).forEach(([k, v]) => { r = r.field(k, v); });
  if (withDoc) r = r.attach('hospitalDocument', PDF, { filename: 'proof.pdf', contentType: 'application/pdf' });
  return r;
};

describe('Hospital registration', () => {
  it('creates a PENDING application with ID, history, citizen account and notifications', async () => {
    const { agent, hospital } = await hospitalAgent();
    const res = await submit(agent, fields(hospital));
    expect(res.status).toBe(201);
    const a = res.body.data.application;
    expect(a.applicationId).toMatch(/^APP-\d{4}-\d{6}$/);
    expect(a.status).toBe('PENDING');
    expect(a.history).toHaveLength(1);
    expect(a.documents[0].storedName).toBeUndefined(); // disk name never exposed
    expect(res.body.data.parentLinked).toBe(true);

    const citizen = await User.findOne({ email: 'priya@example.com' });
    expect(citizen.role).toBe(ROLES.USER);
    expect(outbox.some((m) => m.text.includes('Temporary password'))).toBe(true);
    expect(await Notification.countDocuments()).toBe(2); // hospital + citizen
  });

  it('generates sequential application IDs', async () => {
    const { agent, hospital } = await hospitalAgent();
    const a = await submit(agent, fields(hospital, { firstName: 'One', parentEmail: '' }));
    const b = await submit(agent, fields(hospital, { firstName: 'Two', motherName: 'Other', parentEmail: '' }));
    const n = (r) => Number(r.body.data.application.applicationId.slice(-6));
    expect(n(b)).toBe(n(a) + 1);
  });

  it('flags possible duplicates instead of blocking them', async () => {
    const { agent, hospital } = await hospitalAgent();
    await submit(agent, fields(hospital, { parentEmail: '' }));
    const dup = await submit(agent, fields(hospital, { parentEmail: '' }));
    expect(dup.status).toBe(201);
    const stored = await BirthApplication.findById(dup.body.data.application._id);
    expect(stored.duplicateFlags.length).toBeGreaterThan(0);
  });

  it('rejects a missing hospital document, bad file types and fake PDFs', async () => {
    const { agent, hospital } = await hospitalAgent();
    expect((await submit(agent, fields(hospital), false)).status).toBe(422);

    let r = agent.post('/api/hospital/registrations');
    Object.entries(fields(hospital)).forEach(([k, v]) => { r = r.field(k, v); });
    const bad = await r.attach('hospitalDocument', Buffer.from('MZ-not-a-pdf'), { filename: 'x.pdf', contentType: 'application/pdf' });
    expect(bad.status).toBe(422);

    let r2 = agent.post('/api/hospital/registrations');
    Object.entries(fields(hospital)).forEach(([k, v]) => { r2 = r2.field(k, v); });
    const exe = await r2.attach('hospitalDocument', Buffer.from('x'), { filename: 'x.exe', contentType: 'application/x-msdownload' });
    expect(exe.status).toBe(422);
  });

  it('validates fields (future DOB, weight, phone)', async () => {
    const { agent, hospital } = await hospitalAgent();
    const res = await submit(agent, fields(hospital, { dateOfBirth: '2999-01-01', birthWeightKg: '15', guardianPhone: '123' }));
    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['dateOfBirth', 'birthWeightKg', 'guardianPhone']));
  });

  it('rejects a registration number that is not the caller\'s hospital', async () => {
    const { agent, hospital } = await hospitalAgent();
    const res = await submit(agent, fields(hospital, { hospitalRegistrationNumber: 'MH-HOSP-9999' }));
    expect(res.status).toBe(422);
  });

  it('only HOSPITAL role may submit', async () => {
    const citizen = await h.createUser(ROLES.USER, { email: 'c@example.com' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: citizen.email, password: PASSWORD, role: 'USER' });
    expect((await agent.post('/api/hospital/registrations')).status).toBe(403);
  });
});

describe('Access scoping, listing and demo verification', () => {
  it('hospitals only see their own applications (404 for others)', async () => {
    const A = await hospitalAgent(1);
    const B = await hospitalAgent(2);
    const created = await submit(A.agent, fields(A.hospital, { parentEmail: '' }));
    const id = created.body.data.application._id;

    expect((await A.agent.get(`/api/hospital/registrations/${id}`)).status).toBe(200);
    expect((await B.agent.get(`/api/hospital/registrations/${id}`)).status).toBe(404);
    expect((await B.agent.get('/api/applications')).body.data.items).toHaveLength(0);
    expect((await B.agent.get(`/api/applications/${id}/documents/${created.body.data.application.documents[0]._id}`)).status).toBe(404);
  });

  it('paginates, filters and searches', async () => {
    const { agent, hospital } = await hospitalAgent();
    for (const name of ['Rahul', 'Rohan', 'Sita']) {
      await submit(agent, fields(hospital, { firstName: name, motherName: `M ${name}`, parentEmail: '' }));
    }
    const page = await agent.get('/api/hospital/registrations?page=1&limit=2');
    expect(page.body.data.items).toHaveLength(2);
    expect(page.body.data.pagination).toMatchObject({ total: 3, totalPages: 2 });
    const found = (await agent.get('/api/hospital/registrations?search=Rohan')).body.data.items;
    expect(found).toHaveLength(1);
    expect(found[0].child.fullName).toBe('Rohan Sharma');
    expect((await agent.get('/api/hospital/registrations?status=APPROVED')).body.data.items).toHaveLength(0);
    expect((await agent.get('/api/hospital/registrations?limit=999')).status).toBe(422);
  });

  it('stats are scoped and include today', async () => {
    const { agent, hospital } = await hospitalAgent();
    await submit(agent, fields(hospital, { parentEmail: '' }));
    const s = (await agent.get('/api/applications/stats')).body.data;
    expect(s).toMatchObject({ total: 1, pending: 1, approved: 0, today: 1 });
  });

  it('mock biometric/identity proofs are required to be genuine and never accept real Aadhaar numbers', async () => {
    const { agent, hospital } = await hospitalAgent();
    const bio = await agent.post('/api/hospital/mock/biometric');
    expect(bio.body.data.isDemo).toBe(true);
    const real = await agent.post('/api/hospital/mock/aadhaar').send({ maskedReference: '123456789012' });
    expect(real.status).toBe(422);

    const ok = await agent.post('/api/hospital/mock/aadhaar').send({ maskedReference: 'XXXX-XXXX-1234' });
    const res = await submit(agent, fields(hospital, {
      parentEmail: '', maskedReference: 'XXXX-XXXX-1234', biometricProof: bio.body.data.proof, identityProof: ok.body.data.proof,
    }));
    expect(res.body.data.application.biometricVerification.status).toBe('VERIFIED');
    const forged = await submit(agent, fields(hospital, { firstName: 'Forged', motherName: 'F', parentEmail: '', biometricProof: 'fake.token.value' }));
    expect(forged.status).toBe(422);
  });

  it('public track endpoint returns status only', async () => {
    const { agent, hospital } = await hospitalAgent();
    const created = await submit(agent, fields(hospital, { parentEmail: '' }));
    const res = await request(app).get(`/api/applications/track/${created.body.data.application.applicationId}`);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(['applicationId', 'history', 'status']);
    expect((await request(app).get('/api/applications/track/APP-2026-999999')).status).toBe(404);
  });
});
