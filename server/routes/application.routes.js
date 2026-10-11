const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/application.controller');
const v = require('../validators/application.validators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocuments, removeUploadedFiles } = require('../middleware/upload');
const { ROLES } = require('../constants');

const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { success: false, message: 'Too many lookups, slow down', errors: [] } });

router.get('/track/:applicationId', trackLimiter, c.track); // public

router.use(protect);
router.get('/stats', c.stats);
router.get('/', validate(v.listQuery, 'query'), c.list);
router.get('/:id', c.get);
router.get('/:id/documents/:docId', c.downloadDocument);

// Corrections: the schema depends on the caller's role; uploaded files are cleaned up on validation failure.
const validateCorrection = (req, res, next) =>
  validate(req.user.role === ROLES.HOSPITAL ? v.hospitalCorrection : v.citizenCorrection)(req, res, (err) => {
    if (err) removeUploadedFiles(req);
    next(err);
  });
const correctionChain = [authorize(ROLES.HOSPITAL, ROLES.USER), ...uploadDocuments, validateCorrection];
router.patch('/:id', ...correctionChain, c.saveCorrections);
router.patch('/:id/resubmit', ...correctionChain, c.resubmit);

module.exports = router;
