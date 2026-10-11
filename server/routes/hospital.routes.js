const router = require('express').Router();
const c = require('../controllers/hospital.controller');
const v = require('../validators/application.validators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocuments, removeUploadedFiles } = require('../middleware/upload');
const { ROLES } = require('../constants');

// validation failures must also delete files that multer already wrote
const validateBodyAndCleanup = (schema) => (req, res, next) =>
  validate(schema)(req, res, (err) => { if (err) removeUploadedFiles(req); next(err); });

router.use(protect, authorize(ROLES.HOSPITAL));
router.post('/registrations', uploadDocuments, validateBodyAndCleanup(v.createRegistration), c.createRegistration);
router.get('/registrations', validate(v.listQuery, 'query'), c.list);
router.get('/registrations/:id', c.get);
router.post('/mock/biometric', c.mockBiometric);
router.post('/mock/aadhaar', validate(v.maskedBody), c.mockAadhaar);
router.patch('/profile', validate(v.hospitalProfile), c.updateProfile);

module.exports = router;
