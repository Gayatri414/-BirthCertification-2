const router = require('express').Router();
const c = require('../controllers/municipal.controller');
const v = require('../validators/application.validators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants');

router.use(protect, authorize(ROLES.MUNICIPAL_OFFICER));

router.get('/stats', c.stats);
router.get('/reports', validate(v.reportQuery, 'query'), c.reports);
router.get('/hospitals', c.hospitals);
router.get('/audit-logs', validate(v.auditQuery, 'query'), c.auditLogs);

router.get('/applications', validate(v.listQuery, 'query'), c.list);
router.get('/applications/:id', c.get);
router.patch('/applications/:id/review', validate(v.reviewBody), c.review);
router.patch('/applications/:id/approve', validate(v.approveBody), c.approve);
router.post('/applications/:id/certificate', c.generateCertificate);
router.patch('/applications/:id/reject', validate(v.rejectBody), c.reject);
router.patch('/applications/:id/request-resubmission', validate(v.resubmitBody), c.requestResubmission);

module.exports = router;
