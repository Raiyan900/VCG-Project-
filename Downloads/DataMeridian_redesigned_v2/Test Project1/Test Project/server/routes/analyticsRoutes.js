const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const protect = require('../middleware/auth');
const {
	dashboardAnalytics,
	storageAnalytics,
	storageUsersAnalytics,
	storageUserDetails,
} = require('../controllers/analyticsController');

const router = express.Router();
router.use(protect);

router.get('/dashboard', asyncHandler(dashboardAnalytics));
router.get('/storage', asyncHandler(storageAnalytics));
router.get('/storage/users', asyncHandler(storageUsersAnalytics));
router.get('/storage/users/:userId', asyncHandler(storageUserDetails));

module.exports = router;
