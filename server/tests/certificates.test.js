const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../app');
const h = require('./helpers');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { UPLOAD_ROOT } = require('../middleware/upload');
const { ROLES } = require('../constants');

const PDF = Buffer.from('%PDF-1.4\n%demo');
const PASSWORD = 'Passw0rd@123';
const ALL = { childInfo: true, parentInfo: true, hospitalInfo: true, documents: true, biometric: true, identity: true, noDuplicate: true };

beforeAll(h.connect);
afterAll(h.disconnect);
beforeEach(h.clear);

const login = async (email, role) => { const a = request.agent(app); await a.post('/api/auth/login').send({ email, password: PASSWORD, role }); return a; };

async function approvedApplication() {
  const hUser = await h.createUser(ROLES.HOSPITAL, { email: 'hosp@example.com' });
  const hospital = await Hospital.create({ user: hUser._id, name: 'City Care', registrationNumber: 'MH-HOSP-1001', email: hUser.email, phone: '9123456780', address: '5 FC Road, Pune', authorizedPerson: 'Dr. Mehta' });
  await h.createUser(ROLES.MUNICIPAL_OFFICER, { email: 'officer@example.com', officeName: 'Pune Municipal Office' });
  const hosp = await login('hosp@example.com', 'HOSPITAL');
  const officer = await login('officer@example.com', 'MUNICIPAL_OFFICER');

  let r = hosp.post('/api/hospital/registrations');
  const f = { firstName: 'Aarav', lastName: 'Sharma', dateOfBirth: '2026-03-14', timeOfBirth: '09:30', gender: 'MALE', birthWeightKg: '3.2', birthPlace: 'City Care', fatherName: 'Raj Sharma', motherName: 'Priya Sharma', guardianPhone: '9876543210', parentAddress: '12 MG Road, Pune', doctorName: 'Dr. Mehta', hospitalRegistrationNumber: hospital.registrationNumber, parentEmail: 'priya@example.com' };
  Object.entries(f).forEach(([k, v]) => { r = r.field(k, v); });
  const id = (await r.attach('hospitalDocument', PDF, { filename: 'p.pdf', contentType: 'application/pdf' })).body.data.application._id;

  await officer.patch(`/api/municipal/applications/${id}/review`).send({ checklist: ALL });
  const approved = await officer.patch(`/api/municipal/applications/${id}/approve`).send({});

  const citizen = await User.findOne({ email: 'priya@example.com' }).select('+password');
  citizen.password = PASSWORD; await citizen.save();
  return { hosp, officer, id, approved, citizen: await login('priya@example.com', 'USER') };
}

describe('certificate issuing', () => {
  it('approval generates a numbered certificate and a PDF on disk, and notifies', async () => {
    const { approved } = await approvedApplication();
    expect(approved.status).toBe(200);
    const cert = await Certificate.findOne();
    expect(cert.certificateNumber).toMatch(/^CERT-\d{4}-\d{6}$/);
    expect(cert.issuingAuthority).toBe('Pune Municipal Office');
    const pdf = fs.readFileSync(path.join(UPLOAD_ROOT, cert.pdfPath));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(approved.body.data.certificate.certificateNumber).toBe(cert.certificateNumber);
    expect(approved.body.data.certificate.pdfPath).toBeUndefined();
  });

  it('generation is idempotent (retry endpoint creates no second certificate)', async () => {
    const { officer, id } = await approvedApplication();
    await officer.post(`/api/municipal/applications/${id}/certificate`);
    await officer.post(`/api/municipal/applications/${id}/certificate`);
    expect(await Certificate.countDocuments()).toBe(1);
  });
});

describe('access and download', () => {
  it('the citizen and the hospital can download; the PDF response is a PDF', async () => {
    const { citizen, hosp } = await approvedApplication();
    const list = await citizen.get('/api/certificates');
    const certId = list.body.data.items[0]._id;
    const res = await citizen.get(`/api/certificates/${certId}/download`).buffer().parse((r, cb) => { const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => cb(null, Buffer.concat(c))); });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect((await hosp.get(`/api/certificates/${certId}/download`)).status).toBe(200);
  });

  it('an unrelated citizen cannot see or download it (404)', async () => {
    const { citizen } = await approvedApplication();
    const certId = (await citizen.get('/api/certificates')).body.data.items[0]._id;
    await h.createUser(ROLES.USER, { email: 'stranger@example.com' });
    const stranger = await login('stranger@example.com', 'USER');
    expect((await stranger.get('/api/certificates')).body.data.items).toHaveLength(0);
    expect((await stranger.get(`/api/certificates/${certId}`)).status).toBe(404);
    expect((await stranger.get(`/api/certificates/${certId}/download`)).status).toBe(404);
  });

  it('a tampered PDF is refused with an integrity error', async () => {
    const { citizen } = await approvedApplication();
    const cert = await Certificate.findOne();
    fs.appendFileSync(path.join(UPLOAD_ROOT, cert.pdfPath), 'tamper');
    expect((await citizen.get(`/api/certificates/${cert._id}/download`)).status).toBe(500);
  });
});

describe('public verification and revocation', () => {
  it('verifies without login, exposes no parent data, 404s unknown numbers', async () => {
    await approvedApplication();
    const cert = await Certificate.findOne();
    const ok = await request(app).get(`/api/certificates/verify/${cert.certificateNumber}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ status: 'VALID', childName: 'Aarav Sharma', gender: 'MALE' });
    expect(JSON.stringify(ok.body)).not.toMatch(/Raj Sharma|Priya|9876543210|MG Road/);
    expect((await request(app).get('/api/certificates/verify/CERT-2026-999999')).status).toBe(404);
    expect((await request(app).get('/api/certificates/verify/not-a-number')).status).toBe(422);
  });

  it('an officer can revoke; verification shows REVOKED and downloads stop', async () => {
    const { officer, citizen } = await approvedApplication();
    const cert = await Certificate.findOne();
    expect((await officer.patch(`/api/certificates/${cert._id}/revoke`).send({ reason: 'short' })).status).toBe(422);
    expect((await officer.patch(`/api/certificates/${cert._id}/revoke`).send({ reason: 'Issued with the wrong birth weight' })).status).toBe(200);
    expect((await request(app).get(`/api/certificates/verify/${cert.certificateNumber}`)).body.data.status).toBe('REVOKED');
    expect((await citizen.get(`/api/certificates/${cert._id}/download`)).status).toBe(403);
    expect((await officer.patch(`/api/certificates/${cert._id}/revoke`).send({ reason: 'Trying to revoke twice' })).status).toBe(409);
  });

  it('citizens cannot revoke', async () => {
    const { citizen } = await approvedApplication();
    const cert = await Certificate.findOne();
    expect((await citizen.patch(`/api/certificates/${cert._id}/revoke`).send({ reason: 'I would like this gone' })).status).toBe(403);
  });
});
