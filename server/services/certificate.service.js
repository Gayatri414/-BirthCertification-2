const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const BirthApplication = require('../models/BirthApplication');
const Counter = require('../models/Counter');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const audit = require('./audit.service');
const { notify } = require('./notification.service');
const { scopeFilter } = require('./application.service');
const { renderCertificate } = require('../templates/certificateTemplate');
const { UPLOAD_ROOT } = require('../middleware/upload');
const { parsePagination, buildMeta, escapeRegex } = require('../utils/pagination');
const { ROLES, APPLICATION_STATUS, CERTIFICATE_STATUS, NOTIFICATION_TYPES: N, AUDIT_ACTIONS: A } = require('../constants');

const CERT_DIR = path.join(UPLOAD_ROOT, 'certificates');
fs.mkdirSync(CERT_DIR, { recursive: true });

const NUMBER_RE = /^CERT-\d{4}-\d{6}$/;
const DEFAULT_AUTHORITY = 'SmartBirth Municipal Registration Office';

const sha256File = (file) => new Promise((resolve, reject) => {
  const h = crypto.createHash('sha256');
  fs.createReadStream(file).on('data', (c) => h.update(c)).on('error', reject).on('end', () => resolve(h.digest('hex')));
});

async function writePdf(file, data, qr) {
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    out.on('finish', resolve).on('error', reject);
    renderCertificate(out, data, qr);
  });
}

/**
 * Generates the certificate for an APPROVED application. Idempotent: the unique index on
 * `application` guarantees one certificate per application even if two requests race.
 */
async function issueCertificate(applicationId, officer, req) {
  const existing = await Certificate.findOne({ application: applicationId });
  if (existing) return existing;

  const app = await BirthApplication.findById(applicationId).populate('hospital', 'name');
  if (!app) throw ApiError.notFound('Application not found');
  if (app.status !== APPLICATION_STATUS.APPROVED) throw ApiError.conflict('Certificates can only be issued for approved applications');

  const issuedAt = new Date();
  const certificateNumber = await Counter.nextId(`CERT-${issuedAt.getUTCFullYear()}`);
  const verificationCode = crypto.randomBytes(5).toString('hex').toUpperCase();
  const verifyUrl = `${env.publicVerifyUrl.replace(/\/$/, '')}/${certificateNumber}`;
  const issuingAuthority = officer.officeName || DEFAULT_AUTHORITY;

  const qrOptions = { margin: 1, width: 240, errorCorrectionLevel: 'M' };
  const [qrPng, qrCode] = await Promise.all([QRCode.toBuffer(verifyUrl, qrOptions), QRCode.toDataURL(verifyUrl, qrOptions)]);

  const relPath = path.join('certificates', `${certificateNumber}.pdf`);
  const file = path.join(UPLOAD_ROOT, relPath);
  await writePdf(file, {
    certificateNumber, applicationId: app.applicationId, verificationCode, verifyUrl, issuingAuthority, issuedAt,
    signatory: officer.name, child: app.child, parents: app.parents, hospitalName: app.hospital?.name, registrationDate: app.registrationDate,
  }, qrPng);
  const pdfHash = await sha256File(file);

  let cert;
  try {
    cert = await Certificate.create({
      certificateNumber, application: app._id, verificationCode, pdfPath: relPath, pdfHash, qrCode,
      issuedAt, issuedBy: officer._id, issuingAuthority, status: CERTIFICATE_STATUS.VALID,
    });
  } catch (err) {
    fs.unlink(file, () => {});
    if (err.code === 11000) return Certificate.findOne({ application: applicationId }); // lost a race, use the winner's
    throw err;
  }

  await audit.log({ req, actor: officer, action: A.CERTIFICATE_GENERATED, entityType: 'Certificate', entityId: cert._id, description: `Certificate ${certificateNumber} generated for ${app.applicationId}` });
  await Promise.all([...new Set([app.citizen, app.submittedBy].filter(Boolean).map(String))].map((uid) => notify(uid, {
    title: 'Birth certificate generated',
    message: `The birth certificate ${certificateNumber} for application ${app.applicationId} is ready to download.`,
    type: N.CERTIFICATE_GENERATED, application: app._id,
  })));
  return cert;
}

const isStaff = (user) => user.role === ROLES.MUNICIPAL_OFFICER || user.role === ROLES.SUPER_ADMIN;

// Citizens and hospitals only reach certificates of applications they are allowed to see.
async function certificateScope(user) {
  if (isStaff(user)) return {};
  const ids = await BirthApplication.find({ ...(await scopeFilter(user)), status: APPLICATION_STATUS.APPROVED }).distinct('_id');
  return { application: { $in: ids } };
}

const APP_FIELDS = 'applicationId child.fullName child.dateOfBirth child.gender parents.fatherName parents.motherName hospital';
const populateApp = { path: 'application', select: APP_FIELDS, populate: { path: 'hospital', select: 'name' } };

async function listCertificates(user, q) {
  const { page, limit, skip } = parsePagination(q);
  const filter = await certificateScope(user);
  if (q.status) filter.status = q.status;
  if (q.search) filter.certificateNumber = new RegExp(escapeRegex(q.search), 'i');
  const [items, total] = await Promise.all([
    Certificate.find(filter).select('-pdfPath -qrCode -pdfHash -verificationCode').populate(populateApp).sort({ issuedAt: -1 }).skip(skip).limit(limit),
    Certificate.countDocuments(filter),
  ]);
  return { items, pagination: buildMeta(page, limit, total) };
}

async function getCertificate(user, id) {
  const cert = await Certificate.findOne({ _id: id, ...(await certificateScope(user)) })
    .select('-pdfPath -qrCode -pdfHash').populate(populateApp);
  if (!cert) throw ApiError.notFound('Certificate not found');
  return cert;
}

/** Returns the absolute PDF path after checking access, revocation and file integrity. */
async function getDownload(req, id) {
  const cert = await Certificate.findOne({ _id: id, ...(await certificateScope(req.user)) });
  if (!cert) throw ApiError.notFound('Certificate not found');
  if (cert.status === CERTIFICATE_STATUS.REVOKED) throw ApiError.forbidden('This certificate has been revoked and cannot be downloaded');
  const file = path.join(UPLOAD_ROOT, cert.pdfPath);
  if (!fs.existsSync(file)) throw new ApiError(500, 'Certificate file is missing. Please contact support');
  if ((await sha256File(file)) !== cert.pdfHash) {
    console.error(`Integrity check failed for ${cert.certificateNumber}`);
    throw new ApiError(500, 'Certificate file failed its integrity check. Please contact support');
  }
  await audit.log({ req, action: A.CERTIFICATE_DOWNLOADED, entityType: 'Certificate', entityId: cert._id, description: `Certificate ${cert.certificateNumber} downloaded` });
  return { file, filename: `${cert.certificateNumber}.pdf` };
}

/** Public: only non-sensitive fields. Parents, addresses and phone numbers are never returned. */
async function verifyCertificate(number) {
  const normalized = String(number).trim().toUpperCase();
  if (!NUMBER_RE.test(normalized)) throw ApiError.validation([{ field: 'certificateNumber', message: 'Format must be CERT-YYYY-NNNNNN' }]);
  const cert = await Certificate.findOne({ certificateNumber: normalized }).populate({ path: 'application', select: 'child.fullName child.dateOfBirth child.gender child.birthPlace registrationDate hospital', populate: { path: 'hospital', select: 'name' } });
  if (!cert) throw ApiError.notFound('No certificate found with this number');
  const a = cert.application;
  return {
    status: cert.status, certificateNumber: cert.certificateNumber, childName: a.child.fullName, dateOfBirth: a.child.dateOfBirth,
    gender: a.child.gender, birthPlace: a.child.birthPlace, hospital: a.hospital?.name, registrationDate: a.registrationDate,
    issuingAuthority: cert.issuingAuthority, issuedAt: cert.issuedAt, verifiedAt: new Date(),
  };
}

async function revokeCertificate(req, id, reason) {
  const cert = await Certificate.findOneAndUpdate(
    { _id: id, status: CERTIFICATE_STATUS.VALID }, // atomic: only a VALID certificate can be revoked
    { $set: { status: CERTIFICATE_STATUS.REVOKED, revokedReason: reason, revokedAt: new Date(), revokedBy: req.user._id } }, { new: true });
  if (!cert) {
    if (!(await Certificate.exists({ _id: id }))) throw ApiError.notFound('Certificate not found');
    throw ApiError.conflict('This certificate is already revoked');
  }
  const app = await BirthApplication.findById(cert.application).select('applicationId citizen submittedBy');
  await audit.log({ req, action: A.CERTIFICATE_REVOKED, entityType: 'Certificate', entityId: cert._id, description: `Certificate ${cert.certificateNumber} revoked: ${reason}` });
  await Promise.all([...new Set([app?.citizen, app?.submittedBy].filter(Boolean).map(String))].map((uid) => notify(uid, {
    title: 'Certificate revoked', message: `Certificate ${cert.certificateNumber} was revoked. Reason: ${reason}`, type: N.GENERAL, application: app._id,
  })));
  return cert;
}

module.exports = { issueCertificate, listCertificates, getCertificate, getDownload, verifyCertificate, revokeCertificate, NUMBER_RE };
