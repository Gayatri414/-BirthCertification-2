const service = require('../services/application.service');
const verification = require('../services/mock/verification.service');
const audit = require('../services/audit.service');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { removeUploadedFiles } = require('../middleware/upload');
const { AUDIT_ACTIONS } = require('../constants');

exports.createRegistration = async (req, res, next) => {
  try {
    const { application, parentLinked } = await service.createApplication(req.user, req.body, req.files);
    await audit.log({ req, action: AUDIT_ACTIONS.APPLICATION_SUBMITTED, entityType: 'BirthApplication', entityId: application._id, description: `Application ${application.applicationId} submitted` });
    sendSuccess(res, { application, parentLinked }, 'Birth registration submitted', 201);
  } catch (err) {
    removeUploadedFiles(req); // do not leave orphaned files when the submission fails
    next(err);
  }
};

exports.list = asyncHandler(async (req, res) => sendSuccess(res, await service.listApplications(req.user, req.query)));
exports.get = asyncHandler(async (req, res) => sendSuccess(res, await service.getApplication(req.user, req.params.id)));

exports.mockBiometric = asyncHandler(async (req, res) => {
  const r = await verification.verifyBiometric(req.user._id);
  sendSuccess(res, r, 'DEMO biometric verification completed');
});
exports.mockAadhaar = asyncHandler(async (req, res) => {
  const r = await verification.verifyIdentity(req.user._id, req.body.maskedReference);
  sendSuccess(res, r, r.status === 'VERIFIED' ? 'DEMO identity verification passed' : 'DEMO identity verification failed');
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) throw ApiError.notFound('Hospital profile not found');
  Object.assign(hospital, req.body);
  await hospital.save();
  await User.updateOne({ _id: req.user._id }, { $set: { ...(req.body.phone && { phone: req.body.phone }), ...(req.body.address && { address: req.body.address }), ...(req.body.authorizedPerson && { name: req.body.authorizedPerson }) } });
  sendSuccess(res, { hospital }, 'Hospital profile updated');
});
