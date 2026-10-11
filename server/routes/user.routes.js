const router = require('express').Router();
const c = require('../controllers/user.controller');
const v = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/me', c.getMe);
router.patch('/me', validate(v.updateProfile), c.updateMe);

module.exports = router;
