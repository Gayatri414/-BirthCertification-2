const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const { ROLES } = require('../constants');

let mongod;
exports.connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};
exports.clear = async () => {
  for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({});
};
exports.disconnect = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};

exports.citizenPayload = (over = {}) => ({
  role: 'USER', name: 'Asha Patil', email: 'asha@example.com', phone: '9876543210',
  password: 'Citizen@123', confirmPassword: 'Citizen@123', address: '12 MG Road, Pune', ...over,
});
exports.hospitalPayload = (over = {}) => ({
  role: 'HOSPITAL', hospitalName: 'City Care Hospital', registrationNumber: 'MH-HOSP-1001',
  email: 'citycare@example.com', phone: '9123456780', address: '5 FC Road, Pune',
  authorizedPerson: 'Dr. Mehta', password: 'Hospital@123', confirmPassword: 'Hospital@123', ...over,
});

// Creates an already-verified user of any role directly in DB.
exports.createUser = (role, over = {}) =>
  User.create({
    name: `Test ${role}`, email: `${role.toLowerCase()}@example.com`, phone: '9876543210',
    password: 'Passw0rd@123', role, isVerified: true, ...over,
  });
