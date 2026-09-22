const Dataset = require('../models/Dataset');
const DatasetVersion = require('../models/DatasetVersion');
const aiService = require('../services/aiService');
const { getProviderInfo } = require('../services/aiProvider');
const { buildDatasetAccessFilter, requireDatasetAccess } = require('../middleware/datasetAccess');

function handleAIError(err, res) {
  if (err.code && err.status) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  console.error('[ai] unexpected error:', err);
  return res.status(500).json({ message: 'AI request failed unexpectedly.' });
}

async function buildDatasetPayload(datasetId, fallback = {}) {
  if (!datasetId) return fallback;
  const dataset = await Dataset.findById(datasetId);
  if (!dataset) return fallback;
  const latestVersion = await DatasetVersion.findOne({ dataset: dataset._id }).sort({ createdAt: -1 });
  return {
    name: dataset.name,
    description: dataset.description,
    tags: dataset.tags,
    domain: dataset.domain,
    type: dataset.type,
    metadata: dataset.metadata,
    files: latestVersion?.files || [],
  };
}

async function status(req, res) {
  res.json(getProviderInfo());
}

async function classify(req, res) {
  try {
    const { datasetId, name, description, tags } = req.body;
    if (datasetId) {
      const dataset = await Dataset.findById(datasetId);
      if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
      const access = await requireDatasetAccess(req, res, dataset);
      if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });
    }
    const payload = await buildDatasetPayload(datasetId, { name, description, tags: tags || [] });
    const result = await aiService.classifyDataset(payload);
    res.json(result);
  } catch (err) {
    handleAIError(err, res);
  }
}

async function generateMetadata(req, res) {
  try {
    const { datasetId, name, description, domain } = req.body;
    if (datasetId) {
      const dataset = await Dataset.findById(datasetId);
      if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
      const access = await requireDatasetAccess(req, res, dataset);
      if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });
    }
    const payload = await buildDatasetPayload(datasetId, { name, description, domain });
    const result = await aiService.generateMetadata(payload);
    res.json(result);
  } catch (err) {
    handleAIError(err, res);
  }
}

async function metadataQuality(req, res) {
  const dataset = await Dataset.findById(req.params.id || req.body.datasetId);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });
  const result = aiService.detectMetadataQualityIssues(dataset);
  res.json(result);
}

async function detectDuplicatesAI(req, res) {
  const accessFilter = await buildDatasetAccessFilter(req.user);
  const datasets = await Dataset.find(accessFilter).limit(100).lean();
  const result = aiService.detectDuplicates(datasets);
  res.json(result);
}

module.exports = { status, classify, generateMetadata, metadataQuality, detectDuplicatesAI };
