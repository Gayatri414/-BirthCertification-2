const router = require('express').Router();
router.get('/stats', require('../controllers/public.controller').stats);
module.exports = router;
