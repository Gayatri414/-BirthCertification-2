const Hospital = require('../models/Hospital');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { ROLES } = require('../constants');

exports.getMe = asyncHandler(async (req, res) => {
  const data = { user: req.user };
  if (req.user.role === ROLES.HOSPITAL) data.hospital = await Hospital.findOne({ user: req.user._id });
  sendSuccess(res, data);
});

exports.updateMe = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body); // body is whitelisted & strict-validated (name/phone/address)
  await req.user.save();
  sendSuccess(res, { user: req.user }, 'Profile updated');
});
