const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/certificate.controller');
const v = require('../validators/application.validators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants');

const verifyLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { success: false, message: 'Too many verification requests, slow down', errors: [] } });

router.get('/verify/:certificateNumber', verifyLimiter, c.verify); // public, must stay above /:id

router.use(protect);
router.get('/', validate(v.certificateList, 'query'), c.list);
router.get('/:id', c.get);
router.get('/:id/download', c.download);
router.patch('/:id/revoke', authorize(ROLES.MUNICIPAL_OFFICER, ROLES.SUPER_ADMIN), validate(v.revokeBody), c.revoke);

module.exports = router;
