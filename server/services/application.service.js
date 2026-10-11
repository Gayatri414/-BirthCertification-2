const crypto = require('crypto');
const BirthApplication = require('../models/BirthApplication');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Counter = require('../models/Counter');
const Certificate = require('../models/Certificate');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta, escapeRegex } = require('../utils/pagination');
const { ROLES, APPLICATION_STATUS, NOTIFICATION_TYPES } = require('../constants');
const { KIND_BY_FIELD } = require('../middleware/upload');
const { readProof } = require('./mock/verification.service');
const { notify } = require('./notification.service');
const { sendMail } = require('./mail.service');

const exactCI = (s) => new RegExp(`^${escapeRegex(s)}$`, 'i');

/** Row-level authorization: which applications may this user see? */
async function scopeFilter(user) {
  switch (user.role) {
    case ROLES.USER: return { citizen: user._id };
    case ROLES.HOSPITAL: {
      const h = await Hospital.findOne({ user: user._id }).select('_id');
      return h ? { hospital: h._id } : { _id: null };
    }
    case ROLES.MUNICIPAL_OFFICER:
    case ROLES.SUPER_ADMIN: return {};
    default: return { _id: null };
  }
}

// Officer-only fields are hidden from citizens and hospitals.
const hiddenFor = (role) =>
  role === ROLES.MUNICIPAL_OFFICER || role === ROLES.SUPER_ADMIN ? '' : '-duplicateFlags -checklist -biometricVerification.sampleHash';

function generateTempPassword() {
  return `Sb@${crypto.randomBytes(6).toString('hex')}X1`; // satisfies the password policy
}

/** Links by e-mail only. Phone numbers are not unique/verified, so they must not grant access. */
async function resolveCitizen(data, hospital) {
  if (!data.parentEmail) return { citizen: null };
  const existing = await User.findOne({ email: data.parentEmail });
  if (existing) {
    if (existing.role !== ROLES.USER) {
      throw ApiError.validation([{ field: 'parentEmail', message: 'This email belongs to a non-citizen account' }]);
    }
    return { citizen: existing };
  }
  const tempPassword = generateTempPassword();
  const citizen = await User.create({
    name: data.guardianName || data.motherName, email: data.parentEmail, phone: data.guardianPhone,
    address: data.parentAddress, password: tempPassword, role: ROLES.USER, isVerified: true,
  });
  await sendMail({
    to: citizen.email,
    subject: 'Your SmartBirth account',
    text: `${hospital.name} registered a birth on your behalf.\nLogin email: ${citizen.email}\nTemporary password: ${tempPassword}\nPlease change it after your first login.`,
  });
  return { citizen, created: true };
}

/** Basic heuristic only. It flags possible duplicates for officer review and is not fraud detection. */
async function findDuplicates({ fullName, dateOfBirth, motherName, guardianPhone, hospitalId, excludeId }) {
  const start = new Date(dateOfBirth);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  const matches = await BirthApplication.find({
    ...(excludeId && { _id: { $ne: excludeId } }),
    status: { $ne: APPLICATION_STATUS.REJECTED },
    'child.dateOfBirth': { $gte: start, $lt: end },
    $or: [
      { 'child.fullName': exactCI(fullName), 'parents.motherName': exactCI(motherName) },
      { 'parents.guardianPhone': guardianPhone, hospital: hospitalId },
    ],
  }).select('applicationId child.fullName parents.motherName parents.guardianPhone hospital').limit(5);

  return matches.map((m) => ({
    applicationId: m.applicationId,
    reason: exactCI(fullName).test(m.child.fullName) && exactCI(motherName).test(m.parents.motherName)
      ? 'Same child name, date of birth and mother name'
      : 'Same guardian phone, date of birth and hospital',
  }));
}

async function createApplication(user, data, files = {}) {
  const hospital = await Hospital.findOne({ user: user._id });
  if (!hospital) throw ApiError.forbidden('No hospital profile is linked to this account');
  if (!hospital.isActive) throw ApiError.forbidden('This hospital has been deactivated');
  if (data.hospitalRegistrationNumber.toUpperCase() !== hospital.registrationNumber) {
    throw ApiError.validation([{ field: 'hospitalRegistrationNumber', message: 'Does not match your hospital registration number' }]);
  }
  if (!files.hospitalDocument?.length) {
    throw ApiError.validation([{ field: 'hospitalDocument', message: 'Hospital document is required' }]);
  }

  const bio = data.biometricProof ? readProof(data.biometricProof, 'biometric', user._id) : null;
  const identity = data.identityProof ? readProof(data.identityProof, 'identity', user._id) : null;
  if (identity && identity.maskedReference !== data.maskedReference) {
    throw ApiError.validation([{ field: 'maskedReference', message: 'Reference changed after verification. Verify again' }]);
  }

  const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ');
  const duplicateFlags = await findDuplicates({
    fullName, dateOfBirth: data.dateOfBirth, motherName: data.motherName,
    guardianPhone: data.guardianPhone, hospitalId: hospital._id,
  });
  const { citizen } = await resolveCitizen(data, hospital);

  const documents = Object.entries(files).flatMap(([field, list]) =>
    list.map((f) => ({ kind: KIND_BY_FIELD[field], originalName: f.originalname, storedName: f.filename, mimeType: f.mimetype, size: f.size })));

  const applicationId = await Counter.nextId(`APP-${new Date().getFullYear()}`);
  const now = new Date();
  const application = await BirthApplication.create({
    applicationId,
    child: {
      firstName: data.firstName, middleName: data.middleName, lastName: data.lastName,
      dateOfBirth: data.dateOfBirth, timeOfBirth: data.timeOfBirth, gender: data.gender,
      birthWeightKg: data.birthWeightKg, birthPlace: data.birthPlace,
    },
    parents: {
      fatherName: data.fatherName, motherName: data.motherName, guardianName: data.guardianName,
      guardianPhone: data.guardianPhone, address: data.parentAddress,
    },
    hospital: hospital._id, doctorName: data.doctorName, registrationDate: now,
    submittedBy: user._id, citizen: citizen?._id, documents,
    biometricVerification: bio
      ? { isDemo: true, status: 'VERIFIED', sampleHash: bio.sampleHash, verifiedAt: now }
      : { isDemo: true, status: 'NOT_VERIFIED' },
    identityVerification: identity
      ? { isDemo: true, status: 'VERIFIED', maskedReference: identity.maskedReference, verifiedAt: now }
      : { isDemo: true, status: 'NOT_VERIFIED', maskedReference: data.maskedReference },
    duplicateFlags,
    status: APPLICATION_STATUS.PENDING,
    history: [{ status: APPLICATION_STATUS.PENDING, actor: user._id, actorName: hospital.name, actorRole: user.role, comment: 'Birth registration submitted by hospital', at: now }],
  });

  await notify(user._id, {
    title: 'Registration submitted',
    message: `Application ${applicationId} for ${fullName} was submitted and is awaiting municipal verification.`,
    type: NOTIFICATION_TYPES.REGISTRATION_SUBMITTED, application: application._id,
  });
  if (citizen) {
    await notify(citizen._id, {
      title: 'Birth registration successful',
      message: `${hospital.name} registered ${fullName}. Application ID: ${applicationId}. You can track its status in your dashboard.`,
      type: NOTIFICATION_TYPES.REGISTRATION_SUCCESSFUL, application: application._id,
    });
  }
  return { application, hospitalName: hospital.name, parentLinked: !!citizen };
}

async function listApplications(user, q) {
  const { page, limit, skip } = parsePagination(q);
  const filter = await scopeFilter(user);

  if (q.status) filter.status = q.status;
  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) filter.createdAt.$gte = new Date(`${q.from}T00:00:00.000Z`);
    if (q.to) filter.createdAt.$lte = new Date(`${q.to}T23:59:59.999Z`);
  }
  if (q.hospital && (user.role === ROLES.MUNICIPAL_OFFICER || user.role === ROLES.SUPER_ADMIN)) filter.hospital = q.hospital;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$and = [{ $or: [{ applicationId: rx }, { 'child.fullName': rx }, { 'parents.motherName': rx }, { 'parents.fatherName': rx }, { 'parents.guardianName': rx }] }];
  }

  const sort = q.sort ? { [q.sort.replace(/^-/, '')]: q.sort.startsWith('-') ? -1 : 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    BirthApplication.find(filter).select('-history -documents -duplicateFlags -checklist -biometricVerification -identityVerification')
      .populate('hospital', 'name').sort(sort).skip(skip).limit(limit),
    BirthApplication.countDocuments(filter),
  ]);
  return { items, pagination: buildMeta(page, limit, total) };
}

async function getApplication(user, id) {
  const filter = { _id: id, ...(await scopeFilter(user)) };
  const app = await BirthApplication.findOne(filter).select(hiddenFor(user.role))
    .populate('hospital', 'name registrationNumber address phone').populate('reviewedBy', 'name');
  if (!app) throw ApiError.notFound('Application not found'); // 404 (not 403) so IDs of others cannot be probed
  const data = app.toJSON();
  if (app.status === APPLICATION_STATUS.APPROVED) {
    data.certificate = await Certificate.findOne({ application: app._id }).select('-pdfPath -qrCode');
  }
  return data;
}

async function getStats(user) {
  const filter = await scopeFilter(user);
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const [rows, today] = await Promise.all([
    BirthApplication.aggregate([{ $match: filter }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    BirthApplication.countDocuments({ ...filter, createdAt: { $gte: startOfToday } }),
  ]);
  const by = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  return {
    total: rows.reduce((a, r) => a + r.n, 0),
    pending: by.PENDING || 0, underReview: by.UNDER_REVIEW || 0, approved: by.APPROVED || 0,
    rejected: by.REJECTED || 0, resubmission: by.RESUBMISSION_REQUIRED || 0, today,
  };
}

/** Public status lookup: minimal fields only, no personal data. */
async function trackApplication(applicationId) {
  const app = await BirthApplication.findOne({ applicationId }).select('applicationId status history');
  if (!app) throw ApiError.notFound('No application found with this ID');
  return {
    applicationId: app.applicationId, status: app.status,
    history: app.history.map((h) => ({ status: h.status, at: h.at, comment: ['REJECTED', 'RESUBMISSION_REQUIRED'].includes(h.status) ? h.comment : undefined })),
  };
}

async function getDocument(user, id, docId) {
  const app = await BirthApplication.findOne({ _id: id, ...(await scopeFilter(user)) }).select('documents');
  const doc = app?.documents.id(docId);
  if (!doc) throw ApiError.notFound('Document not found');
  return doc;
}

module.exports = { findDuplicates, createApplication, listApplications, getApplication, getStats, trackApplication, getDocument, scopeFilter };
