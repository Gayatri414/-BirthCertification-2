const BirthApplication = require('../models/BirthApplication');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { ROLES, APPLICATION_STATUS } = require('../constants');

// Aggregate counts only: no personal data.
exports.stats = asyncHandler(async (req, res) => {
  const [registrations, approved, hospitals, offices] = await Promise.all([
    BirthApplication.countDocuments(),
    BirthApplication.countDocuments({ status: APPLICATION_STATUS.APPROVED }),
    Hospital.countDocuments({ isActive: true }),
    User.distinct('officeName', { role: ROLES.MUNICIPAL_OFFICER, isActive: true, officeName: { $nin: [null, ''] } }),
  ]);
  sendSuccess(res, { registrations, approved, hospitals, offices: offices.length });
});
