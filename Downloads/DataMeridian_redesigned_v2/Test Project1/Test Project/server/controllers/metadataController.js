const Dataset = require('../models/Dataset');
const { metadataCompleteness } = require('../services/metadataService');
const logActivity = require('../utils/logActivity');
const { requireDatasetAccess, requireDatasetPermission } = require('../middleware/datasetAccess');

async function updateMetadata(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Editor');
  if (!access) return;

  dataset.metadata = { ...dataset.metadata.toObject(), ...req.body };
  await dataset.save();

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'metadata-updated',
    description: `${req.user.name} updated metadata for "${dataset.name}"`,
  });

  const completeness = metadataCompleteness(dataset);
  res.json({ dataset, completeness, access: await requireDatasetAccess(req, res, dataset) });
}

async function getMetadataCompleteness(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });

  res.json({ completeness: metadataCompleteness(dataset), access });
}

module.exports = { updateMetadata, getMetadataCompleteness };
