const request = require('supertest');
const express = require('express');
const app = require('../app');
const h = require('./helpers');
const { protect, authorize } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');
const { outbox } = require('../services/mail.service');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { ROLES } = require('../constants');

beforeAll(h.connect);
afterAll(h.disconnect);
beforeEach(async () => { await h.clear(); outbox.length = 0; });

describe('Registration', () => {
  it('registers a citizen, hashes the password and never returns it', async () => {
    const res = await request(app).post('/api/auth/register').send(h.citizenPayload());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.password).toBeUndefined();
    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    expect(stored.password).not.toBe('Citizen@123');
    expect(stored.isVerified).toBe(false);
  });

  it('registers a hospital with linked Hospital profile', async () => {
    const res = await request(app).post('/api/auth/register').send(h.hospitalPayload());
    expect(res.status).toBe(201);
    expect(await Hospital.countDocuments({ registrationNumber: 'MH-HOSP-1001' })).toBe(1);
  });

  it('returns 409 on duplicate email', async () => {
    await request(app).post('/api/auth/register').send(h.citizenPayload());
    const res = await request(app).post('/api/auth/register').send(h.citizenPayload());
    expect(res.status).toBe(409);
  });

  it('returns 422 with field errors for weak password / mismatch / bad phone', async () => {
    const res = await request(app).post('/api/auth/register')
      .send(h.citizenPayload({ password: 'weak', confirmPassword: 'nope', phone: '123' }));
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['password', 'phone']));
  });

  it('refuses public registration of privileged roles', async () => {
    const res = await request(app).post('/api/auth/register').send(h.citizenPayload({ role: 'SUPER_ADMIN' }));
    expect(res.status).toBe(422);
  });
});

describe('OTP + Login', () => {
  it('blocks login until OTP is verified, then allows it', async () => {
    await request(app).post('/api/auth/register').send(h.citizenPayload());
    const creds = { email: 'asha@example.com', password: 'Citizen@123', role: 'USER' };

    expect((await request(app).post('/api/auth/login').send(creds)).status).toBe(403);

    const bad = await request(app).post('/api/auth/verify-otp').send({ email: creds.email, code: '000000' });
    expect(bad.status).toBe(400);

    const ok = await request(app).post('/api/auth/verify-otp').send({ email: creds.email, code: '123456' });
    expect(ok.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send(creds);
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    expect(login.body.data.token).toBeUndefined();
  });

  it('rejects wrong password and wrong role with the same 401', async () => {
    await h.createUser(ROLES.USER, { email: 'u@example.com' });
    const wrongPw = await request(app).post('/api/auth/login').send({ email: 'u@example.com', password: 'Nope@1234', role: 'USER' });
    const wrongRole = await request(app).post('/api/auth/login').send({ email: 'u@example.com', password: 'Passw0rd@123', role: 'HOSPITAL' });
    expect(wrongPw.status).toBe(401);
    expect(wrongRole.status).toBe(401);
    expect(wrongRole.body.message).toBe(wrongPw.body.message);
  });

  it('blocks deactivated accounts', async () => {
    await h.createUser(ROLES.USER, { email: 'off@example.com', isActive: false });
    const res = await request(app).post('/api/auth/login').send({ email: 'off@example.com', password: 'Passw0rd@123', role: 'USER' });
    expect(res.status).toBe(403);
  });

  it('writes an audit log on login', async () => {
    await h.createUser(ROLES.USER, { email: 'a@example.com' });
    await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'Passw0rd@123', role: 'USER' });
    expect(await AuditLog.countDocuments({ action: 'LOGIN' })).toBe(1);
  });
});

describe('Session, logout and authorization', () => {
  const loginAgent = async (role = ROLES.USER) => {
    await h.createUser(role, { email: 'x@example.com' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'x@example.com', password: 'Passw0rd@123', role });
    return agent;
  };

  it('GET /users/me needs authentication (401)', async () => {
    expect((await request(app).get('/api/users/me')).status).toBe(401);
  });

  it('returns profile for logged-in user and supports update', async () => {
    const agent = await loginAgent();
    const me = await agent.get('/api/users/me');
    expect(me.status).toBe(200);
    const upd = await agent.patch('/api/users/me').send({ name: 'New Name' });
    expect(upd.body.data.user.name).toBe('New Name');
    // mass-assignment of role must be rejected by the strict schema
    expect((await agent.patch('/api/users/me').send({ role: 'SUPER_ADMIN' })).status).toBe(422);
  });

  it('logout clears the cookie', async () => {
    const agent = await loginAgent();
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);
    expect((await agent.get('/api/users/me')).status).toBe(401);
  });

  it('authorize() returns 403 for the wrong role and passes for the right one', async () => {
    const mini = express();
    mini.use(require('cookie-parser')());
    mini.get('/officer-only', protect, authorize(ROLES.MUNICIPAL_OFFICER), (req, res) => res.json({ ok: true }));
    mini.use(errorHandler);

    const user = await h.createUser(ROLES.USER, { email: 'c@example.com' });
    const officer = await h.createUser(ROLES.MUNICIPAL_OFFICER, { email: 'o@example.com' });
    const { signToken } = require('../utils/token');

    expect((await request(mini).get('/officer-only').set('Authorization', `Bearer ${signToken(user)}`)).status).toBe(403);
    expect((await request(mini).get('/officer-only').set('Authorization', `Bearer ${signToken(officer)}`)).status).toBe(200);
  });
});

describe('Password flows', () => {
  it('change-password requires correct current password and invalidates login with old one', async () => {
    await h.createUser(ROLES.USER, { email: 'p@example.com' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'p@example.com', password: 'Passw0rd@123', role: 'USER' });

    const wrong = await agent.post('/api/auth/change-password').send({ currentPassword: 'Wrong@1234', newPassword: 'Brand@New1' });
    expect(wrong.status).toBe(422);

    const ok = await agent.post('/api/auth/change-password').send({ currentPassword: 'Passw0rd@123', newPassword: 'Brand@New1' });
    expect(ok.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email: 'p@example.com', password: 'Passw0rd@123', role: 'USER' });
    expect(oldLogin.status).toBe(401);
  });

  it('forgot + reset password round trip; token is single-use', async () => {
    await h.createUser(ROLES.USER, { email: 'r@example.com' });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(unknown.status).toBe(200); // no account enumeration

    await request(app).post('/api/auth/forgot-password').send({ email: 'r@example.com' });
    const token = /token=([a-f0-9]+)/.exec(outbox.at(-1).text)[1];

    const reset = await request(app).post('/api/auth/reset-password')
      .send({ token, password: 'Reset@1234', confirmPassword: 'Reset@1234' });
    expect(reset.status).toBe(200);

    const again = await request(app).post('/api/auth/reset-password')
      .send({ token, password: 'Another@1234', confirmPassword: 'Another@1234' });
    expect(again.status).toBe(400);

    const login = await request(app).post('/api/auth/login').send({ email: 'r@example.com', password: 'Reset@1234', role: 'USER' });
    expect(login.status).toBe(200);
  });
});
