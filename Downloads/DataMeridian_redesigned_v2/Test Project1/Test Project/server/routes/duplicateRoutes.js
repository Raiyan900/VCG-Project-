const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const protect = require('../middleware/auth');
const { listDuplicates, scanForDuplicates, resolveDuplicate } = require('../controllers/duplicateController');

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(listDuplicates));
router.post('/scan', asyncHandler(scanForDuplicates));
router.post('/:id/resolve', asyncHandler(resolveDuplicate));

module.exports = router;
