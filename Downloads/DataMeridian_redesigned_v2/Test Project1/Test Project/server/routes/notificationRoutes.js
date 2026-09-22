const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const protect = require('../middleware/auth');
const { listNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(listNotifications));
router.put('/:id/read', asyncHandler(markAsRead));
router.put('/read-all', asyncHandler(markAllAsRead));

module.exports = router;
