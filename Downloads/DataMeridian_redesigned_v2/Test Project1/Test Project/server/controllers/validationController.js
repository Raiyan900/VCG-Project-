const Dataset = require('../models/Dataset');
const DatasetVersion = require('../models/DatasetVersion');
const Validation = require('../models/Validation');
const { runValidation } = require('../services/validationService');
const logActivity = require('../utils/logActivity');
const notify = require('../utils/notify');
const { requireDatasetAccess, requireDatasetPermission } = require('../middleware/datasetAccess');

async function validateDataset(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Editor');
  if (!access) return;

  const latestVersion = await DatasetVersion.findOne({ dataset: dataset._id }).sort({ createdAt: -1 });
  const result = runValidation(dataset, latestVersion);

  const validation = await Validation.create({
    dataset: dataset._id,
    version: dataset.currentVersion,
    status: result.status,
    checks: result.checks,
    warnings: result.warnings,
    errors: result.errors,
    score: result.score,
  });

  if (latestVersion) {
    latestVersion.validationStatus = result.status;
    await latestVersion.save();
  }

  dataset.status = result.status === 'Failed' ? 'Draft' : 'Active';
  dataset.lifecycle.validate = result.status !== 'Failed';
  await dataset.save();

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'validated',
    description: `Validation completed for "${dataset.name}" — ${result.status} (${result.score}%)`,
  });

  await notify({
    user: dataset.owner,
    type: 'validation',
    message: `Validation completed for "${dataset.name}": ${result.status} (${result.score}%)`,
    dataset: dataset._id,
  });

  res.json({ validation, dataset, access: await requireDatasetAccess(req, res, dataset) });
}

async function getLatestValidation(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });

  const validation = await Validation.findOne({ dataset: dataset._id }).sort({ createdAt: -1 });
  res.json({ validation, access });
}

async function getValidationHistory(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });

  const validations = await Validation.find({ dataset: dataset._id }).sort({ createdAt: -1 });
  res.json({ validations, access });
}

module.exports = { validateDataset, getLatestValidation, getValidationHistory };
