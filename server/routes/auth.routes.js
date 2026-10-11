const router = require('express').Router();
const c = require('../controllers/auth.controller');
const v = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const validateCitizen = validate(v.registerCitizen);
const validateHospital = validate(v.registerHospital);

// Public self-registration is limited to citizens and hospitals; officers/admins are admin-created.
const pickRegistration = (req, res, next) => {
  const role = req.body?.role;
  if (role === 'HOSPITAL') { req.registerAs = 'HOSPITAL'; return validateHospital(req, res, next); }
  if (role === 'USER') { req.registerAs = 'USER'; return validateCitizen(req, res, next); }
  return res.status(422).json({
    success: false, message: 'Validation failed',
    errors: [{ field: 'role', message: 'Role must be USER or HOSPITAL' }],
  });
};
const register = (req, res, next) =>
  (req.registerAs === 'HOSPITAL' ? c.registerHospital : c.registerCitizen)(req, res, next);

router.post('/register', pickRegistration, register);
router.post('/login', validate(v.login), c.login);
router.post('/verify-otp', validate(v.verifyOtp), c.verifyOtp);
router.post('/resend-otp', validate(v.resendOtp), c.resendOtp);
router.post('/forgot-password', validate(v.forgotPassword), c.forgotPassword);
router.post('/reset-password', validate(v.resetPassword), c.resetPassword);
router.post('/logout', protect, c.logout);
router.post('/change-password', protect, validate(v.changePassword), c.changePassword);

module.exports = router;
