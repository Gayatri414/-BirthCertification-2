const appService = require('../services/application.service');
const review = require('../services/review.service');
const analytics = require('../services/analytics.service');
const audit = require('../services/audit.service');
const Hospital = require('../models/Hospital');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

exports.list = asyncHandler(async (req, res) => sendSuccess(res, await appService.listApplications(req.user, req.query)));
exports.get = asyncHandler(async (req, res) => sendSuccess(res, await appService.getApplication(req.user, req.params.id)));
exports.hospitals = asyncHandler(async (req, res) =>
  sendSuccess(res, { items: await Hospital.find().select('name').sort('name') }));

exports.review = asyncHandler(async (req, res) =>
  sendSuccess(res, await review.startOrUpdateReview(req, req.params.id, req.body.checklist), 'Review updated'));
exports.approve = asyncHandler(async (req, res) =>
  sendSuccess(res, await review.approve(req, req.params.id, req.body.comment), 'Application approved'));
exports.reject = asyncHandler(async (req, res) =>
  sendSuccess(res, await review.reject(req, req.params.id, req.body.reason), 'Application rejected'));
exports.requestResubmission = asyncHandler(async (req, res) =>
  sendSuccess(res, await review.requestResubmission(req, req.params.id, req.body.comments), 'Resubmission requested'));

exports.stats = asyncHandler(async (req, res) => {
  const [counts, monthly, statusDistribution] = await Promise.all([
    appService.getStats(req.user), analytics.registrationsByMonth({}, 12), analytics.statusDistribution({}),
  ]);
  sendSuccess(res, { counts: { ...counts, pendingVerification: counts.pending + counts.underReview }, monthly, statusDistribution });
});

exports.reports = asyncHandler(async (req, res) => {
  const months = req.query.months || 6;
  const [registrations, decisions, hospitals, statusDistribution] = await Promise.all([
    analytics.registrationsByMonth({}, months), analytics.decisionsByMonth({}, months),
    analytics.byHospital({}), analytics.statusDistribution({}),
  ]);
  sendSuccess(res, { months, registrations, decisions, hospitals, statusDistribution });
});

exports.auditLogs = asyncHandler(async (req, res) => sendSuccess(res, await audit.listLogs(req.query, { workflowOnly: true })));

const certificates = require('../services/certificate.service');
exports.generateCertificate = asyncHandler(async (req, res) => {
  await certificates.issueCertificate(req.params.id, req.user, req);
  sendSuccess(res, await appService.getApplication(req.user, req.params.id), 'Certificate generated');
});
