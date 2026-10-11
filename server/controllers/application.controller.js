const path = require('path');
const service = require('../services/application.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { UPLOAD_ROOT, removeUploadedFiles } = require('../middleware/upload');
const corrections = require('../services/correction.service');

exports.list = asyncHandler(async (req, res) => sendSuccess(res, await service.listApplications(req.user, req.query)));
exports.get = asyncHandler(async (req, res) => sendSuccess(res, await service.getApplication(req.user, req.params.id)));
exports.stats = asyncHandler(async (req, res) => sendSuccess(res, await service.getStats(req.user)));
exports.track = asyncHandler(async (req, res) => sendSuccess(res, await service.trackApplication(req.params.applicationId.toUpperCase())));

exports.downloadDocument = asyncHandler(async (req, res) => {
  const doc = await service.getDocument(req.user, req.params.id, req.params.docId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(path.join(UPLOAD_ROOT, doc.storedName), doc.originalName);
});

// Shared by hospitals (all fields) and citizens (parent fields). The service enforces the allowlist.
const correct = (submit) => async (req, res, next) => {
  try {
    const app = await corrections.applyCorrections(req, req.params.id, req.body, req.files || {}, { submit });
    sendSuccess(res, app, submit ? 'Application resubmitted for review' : 'Draft corrections saved');
  } catch (err) {
    removeUploadedFiles(req); // never leave orphaned uploads behind
    next(err);
  }
};
exports.saveCorrections = correct(false);
exports.resubmit = correct(true);
