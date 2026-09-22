const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const protect = require('../middleware/auth');
const { globalSearch } = require('../controllers/searchController');

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(globalSearch));

module.exports = router;
