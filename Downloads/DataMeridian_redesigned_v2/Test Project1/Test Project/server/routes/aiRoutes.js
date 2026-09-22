const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const protect = require('../middleware/auth');
const { status, classify, generateMetadata, metadataQuality, detectDuplicatesAI } = require('../controllers/aiController');

const router = express.Router();
router.use(protect);

router.get('/status', asyncHandler(status));
router.post('/classify', asyncHandler(classify));
router.post('/generate-metadata', asyncHandler(generateMetadata));
router.post('/metadata-quality/:id', asyncHandler(metadataQuality));
router.post('/detect-duplicates', asyncHandler(detectDuplicatesAI));

module.exports = router;
