/**
 * DEMO seed. Creates the four demo accounts (safe to run repeatedly).
 * All accounts below are DEMO ACCOUNTS with publicly documented passwords.
 * Never run this against a production database.
 */
const env = require('../config/env');
const connectDB = require('../config/db');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { ROLES } = require('../constants');

const DEMO_USERS = [
  { name: 'Demo Citizen', email: 'citizen@example.com', phone: '9876500001', password: 'Citizen@123', role: ROLES.USER, address: '12 MG Road, Pune' },
  { name: 'Dr. Demo Authorized', email: 'hospital@example.com', phone: '9876500002', password: 'Hospital@123', role: ROLES.HOSPITAL, address: '5 FC Road, Pune' },
  { name: 'Demo Municipal Officer', email: 'municipal@example.com', phone: '9876500003', password: 'Municipal@123', role: ROLES.MUNICIPAL_OFFICER, address: 'Municipal Office, Pune', officeName: 'Pune Municipal Office', employeeId: 'PMC-0001' },
  { name: 'Demo Super Admin', email: 'admin@example.com', phone: '9876500004', password: 'Admin@123', role: ROLES.SUPER_ADMIN, address: 'Head Office, Pune' },
];

async function upsertUser(data) {
  let user = await User.findOne({ email: data.email });
  if (!user) user = new User({ ...data, isVerified: true, isActive: true });
  else Object.assign(user, { ...data, isVerified: true, isActive: true }); // re-hashed by the pre-save hook
  await user.save();
  return user;
}

async function run() {
  if (env.nodeEnv === 'production') throw new Error('Refusing to seed demo accounts in production');
  await connectDB();
  const users = {};
  for (const u of DEMO_USERS) users[u.role] = await upsertUser(u);

  await Hospital.findOneAndUpdate(
    { user: users[ROLES.HOSPITAL]._id },
    { user: users[ROLES.HOSPITAL]._id, name: 'City Care Hospital (DEMO)', registrationNumber: 'MH-HOSP-1001', email: 'hospital@example.com', phone: '9876500002', address: '5 FC Road, Pune', authorizedPerson: 'Dr. Demo Authorized', isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('\nDEMO accounts ready:');
  DEMO_USERS.forEach((u) => console.log(`  ${u.role.padEnd(18)} ${u.email}  /  ${u.password}`));
  process.exit(0);
}

run().catch((err) => { console.error('Seed failed:', err.message); process.exit(1); });
