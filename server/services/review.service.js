const BirthApplication = require('../models/BirthApplication');
const ApiError = require('../utils/ApiError');
const audit = require('./audit.service');
const { notify } = require('./notification.service');
const { getApplication } = require('./application.service');
const { issueCertificate } = require('./certificate.service');
const { APPLICATION_STATUS: S, STATUS_TRANSITIONS, NOTIFICATION_TYPES: N, AUDIT_ACTIONS: A } = require('../constants');

const CHECKLIST_LABELS = {
  childInfo: 'Child information verified',
  parentInfo: 'Parent information verified',
  hospitalInfo: 'Hospital information verified',
  documents: 'Documents verified',
  biometric: 'Mock biometric verification completed',
  identity: 'Mock identity verification completed',
  noDuplicate: 'No duplicate application found',
};

/**
 * The single place where status changes. The `status: expectedFrom` condition in the query
 * makes the change atomic, so two officers deciding at once cannot both succeed.
 */
async function transition(user, id, from, to, extra, comment) {
  if (!(STATUS_TRANSITIONS[from] || []).includes(to)) {
    throw ApiError.conflict(`Cannot move an application from ${from} to ${to}`);
  }
  const now = new Date();
  const updated = await BirthApplication.findOneAndUpdate(
    { _id: id, status: from },
    {
      $set: { status: to, reviewedBy: user._id, reviewedAt: now, ...extra },
      $push: { history: { status: to, actor: user._id, actorName: user.name, actorRole: user.role, comment, at: now } },
    },
    { new: true }
  );
  if (!updated) {
    const current = await BirthApplication.findById(id).select('status');
    if (!current) throw ApiError.notFound('Application not found');
    throw ApiError.conflict(`Application is already ${current.status}. Reload to see the latest state`);
  }
  return updated;
}

const notifyParties = (app, payload) =>
  Promise.all([...new Set([app.citizen, app.submittedBy].filter(Boolean).map(String))]
    .map((uid) => notify(uid, { ...payload, application: app._id })));

async function startOrUpdateReview(req, id, checklist) {
  const user = req.user;
  let app = await BirthApplication.findById(id).select('status applicationId citizen submittedBy');
  if (!app) throw ApiError.notFound('Application not found');

  if (app.status === S.PENDING) {
    app = await transition(user, id, S.PENDING, S.UNDER_REVIEW, {}, 'Review started by municipal officer');
    await audit.log({ req, action: A.APPLICATION_REVIEW, entityType: 'BirthApplication', entityId: id, description: `Review started for ${app.applicationId}` });
    await notifyParties(app, { title: 'Application under review', message: `Application ${app.applicationId} is now being verified by the municipal office.`, type: N.UNDER_REVIEW });
  } else if (app.status !== S.UNDER_REVIEW) {
    throw ApiError.conflict(`An application that is ${app.status} can no longer be reviewed`);
  }

  if (checklist && Object.keys(checklist).length) {
    const $set = Object.fromEntries(Object.entries(checklist).map(([k, v]) => [`checklist.${k}`, v]));
    await BirthApplication.updateOne({ _id: id, status: S.UNDER_REVIEW }, { $set });
    await audit.log({ req, action: A.APPLICATION_REVIEW, entityType: 'BirthApplication', entityId: id, description: `Checklist updated for ${app.applicationId}` });
  }
  return getApplication(user, id);
}

async function approve(req, id, comment) {
  const current = await BirthApplication.findById(id).select('status checklist');
  if (!current) throw ApiError.notFound('Application not found');
  if (current.status !== S.UNDER_REVIEW) throw ApiError.conflict('Start the review before approving this application');

  const missing = Object.keys(CHECKLIST_LABELS).filter((k) => !current.checklist?.[k]);
  if (missing.length) {
    throw ApiError.validation(missing.map((k) => ({ field: `checklist.${k}`, message: `${CHECKLIST_LABELS[k]} is not ticked` })), 'Complete the verification checklist before approving');
  }

  const app = await transition(req.user, id, S.UNDER_REVIEW, S.APPROVED, { rejectionReason: undefined, resubmissionReason: undefined }, comment || 'Application approved');
  await audit.log({ req, action: A.APPLICATION_APPROVED, entityType: 'BirthApplication', entityId: id, description: `Application ${app.applicationId} approved` });
  await notifyParties(app, { title: 'Application approved', message: `Application ${app.applicationId} has been approved by the municipal office.`, type: N.APPROVED });

  // The approval is already committed. If generation fails the officer can retry (issueCertificate is idempotent).
  let certificateFailed = false;
  try { await issueCertificate(id, req.user, req); } catch (err) { certificateFailed = true; console.error(`Certificate generation failed for ${app.applicationId}:`, err.message); }
  const data = await getApplication(req.user, id);
  if (certificateFailed) data.certificateError = 'The application is approved but the certificate could not be generated. Use "Generate certificate" to retry.';
  return data;
}

async function reject(req, id, reason) {
  const app = await transition(req.user, id, S.UNDER_REVIEW, S.REJECTED, { rejectionReason: reason }, reason);
  await audit.log({ req, action: A.APPLICATION_REJECTED, entityType: 'BirthApplication', entityId: id, description: `Application ${app.applicationId} rejected: ${reason}` });
  await notifyParties(app, { title: 'Application rejected', message: `Application ${app.applicationId} was rejected. Reason: ${reason}`, type: N.REJECTED });
  return getApplication(req.user, id);
}

async function requestResubmission(req, id, comments) {
  const app = await transition(req.user, id, S.UNDER_REVIEW, S.RESUBMISSION_REQUIRED, { resubmissionReason: comments }, comments);
  await audit.log({ req, action: A.APPLICATION_RESUBMISSION_REQUESTED, entityType: 'BirthApplication', entityId: id, description: `Resubmission requested for ${app.applicationId}: ${comments}` });
  await notifyParties(app, { title: 'Resubmission required', message: `Application ${app.applicationId} needs corrections: ${comments}`, type: N.RESUBMISSION_REQUIRED });
  return getApplication(req.user, id);
}

module.exports = { startOrUpdateReview, approve, reject, requestResubmission, CHECKLIST_LABELS };
