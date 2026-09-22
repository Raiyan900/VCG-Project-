const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Dataset = require('../models/Dataset');
const DatasetVersion = require('../models/DatasetVersion');
const logActivity = require('../utils/logActivity');
const { recordSnapshot } = require('../services/storageService');
const { uploadFile, deleteFile } = require('../services/storageService');
const { requireDatasetAccess, requireDatasetPermission } = require('../middleware/datasetAccess');

function nextVersion(current) {
  const [major, minor] = current.split('.').map(Number);
  return `${major}.${(minor || 0) + 1}`;
}

function hashFile(file) {
  try {
    const buffer = file.buffer || fs.readFileSync(file.path);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (err) {
    return null;
  }
}

async function uploadVersion(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Contributor');
  if (!access) return;

  const isFirstVersion = (await DatasetVersion.countDocuments({ dataset: dataset._id })) === 0;
  const version = isFirstVersion ? dataset.currentVersion || '1.0' : nextVersion(dataset.currentVersion);
  const uploadedFiles = [];

  try {
    for (const file of req.files || []) {
      const stored = await uploadFile(file, { datasetId: dataset._id, version });
      uploadedFiles.push({
        ...stored,
        path: stored.storageProvider === 'local' ? path.join('uploads', stored.storedName) : undefined,
        hash: hashFile(file),
      });
    }
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => deleteFile(file).catch(() => null)));
    return res.status(500).json({ message: error.message || 'Unable to store uploaded files' });
  }

  const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);

  let datasetVersion;
  try {
    datasetVersion = await DatasetVersion.create({
      dataset: dataset._id,
      version,
      files: uploadedFiles,
      changes: req.body.changes || (isFirstVersion ? 'Initial upload' : 'New version uploaded'),
      size: totalSize,
      createdBy: req.user._id,
      validationStatus: 'Pending',
    });

    dataset.currentVersion = version;
    dataset.size += totalSize;
    dataset.status = dataset.status === 'Draft' ? 'Validating' : dataset.status;
    dataset.lifecycle.version = true;
    await dataset.save();
  } catch (error) {
    if (datasetVersion?._id) await DatasetVersion.deleteOne({ _id: datasetVersion._id });
    await Promise.all(uploadedFiles.map((file) => deleteFile(file).catch(() => null)));
    return res.status(500).json({ message: error.message || 'Unable to save uploaded files' });
  }

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'version-uploaded',
    description: `${req.user.name} uploaded version ${version} of "${dataset.name}"`,
  });

  recordSnapshot();

  res.status(201).json({ version: datasetVersion, dataset, access: await requireDatasetAccess(req, res, dataset) });
}

async function listVersions(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });

  const versions = await DatasetVersion.find({ dataset: dataset._id })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ versions, access });
}

module.exports = { uploadVersion, listVersions };
