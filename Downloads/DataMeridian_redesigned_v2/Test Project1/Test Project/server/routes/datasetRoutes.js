const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');
const datasetController = require('../controllers/datasetController');
const versionController = require('../controllers/versionController');
const metadataController = require('../controllers/metadataController');
const validationController = require('../controllers/validationController');
const collaborationController = require('../controllers/collaborationController');

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(datasetController.listDatasets));
router.post('/', asyncHandler(datasetController.createDataset));
router.get('/:id', asyncHandler(datasetController.getDataset));
router.get('/:id/files/:filename', asyncHandler(datasetController.serveDatasetFile));
router.put('/:id', asyncHandler(datasetController.updateDataset));
router.delete('/:id', asyncHandler(datasetController.deleteDataset));

router.post('/:id/versions', upload.array('files', 20), asyncHandler(versionController.uploadVersion));
router.get('/:id/versions', asyncHandler(versionController.listVersions));

router.put('/:id/metadata', asyncHandler(metadataController.updateMetadata));
router.get('/:id/metadata/completeness', asyncHandler(metadataController.getMetadataCompleteness));

router.post('/:id/validate', asyncHandler(validationController.validateDataset));
router.get('/:id/validation', asyncHandler(validationController.getLatestValidation));
router.get('/:id/validation/history', asyncHandler(validationController.getValidationHistory));

router.post('/:id/share', asyncHandler(datasetController.shareDataset));
router.get('/:id/citations', asyncHandler(datasetController.getCitations));

router.post('/:id/archive', asyncHandler(datasetController.archiveDataset));
router.post('/:id/restore', asyncHandler(datasetController.restoreDataset));
router.post('/:id/retire', asyncHandler(datasetController.retireDataset));

router.get('/:id/collaborators', asyncHandler(collaborationController.listCollaborators));
router.post('/:id/collaborators', asyncHandler(collaborationController.addCollaborator));
router.put('/:id/collaborators/:collabId', asyncHandler(collaborationController.updateCollaborator));
router.delete('/:id/collaborators/:collabId', asyncHandler(collaborationController.removeCollaborator));
router.get('/:id/activity', asyncHandler(collaborationController.getActivity));

module.exports = router;
