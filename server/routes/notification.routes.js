const router = require('express').Router();
const c = require('../controllers/notification.controller');
const validate = require('../middleware/validate');
const { z } = require('zod');
const { protect } = require('../middleware/auth');

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  unread: z.enum(['true', 'false']).optional(),
});

router.use(protect);
router.get('/', validate(listQuery, 'query'), c.list);
router.patch('/read-all', c.markAllRead); // before /:id/read
router.patch('/:id/read', c.markRead);

module.exports = router;
