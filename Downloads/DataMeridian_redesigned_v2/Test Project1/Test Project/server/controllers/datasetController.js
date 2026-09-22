const { deleteFile, downloadFile } = require('../services/storageService');
const Dataset = require('../models/Dataset');
const DatasetVersion = require('../models/DatasetVersion');
const Collaboration = require('../models/Collaboration');
const Duplicate = require('../models/Duplicate');
const logActivity = require('../utils/logActivity');
const notify = require('../utils/notify');
const { recordSnapshot } = require('../services/storageService');
const { buildDatasetAccessFilter, getDatasetAccess, requireDatasetAccess, requireDatasetPermission } = require('../middleware/datasetAccess');

async function listDatasets(req, res) {
  const { search, domain, type, status, visibility, organization, sort } = req.query;
  const filter = {};

  if (search) filter.$text = { $search: search };
  if (domain) filter.domain = domain;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (visibility) filter.visibility = visibility;
  if (organization) filter.organization = organization;

  const accessFilter = await buildDatasetAccessFilter(req.user);
  let query = Dataset.find({ ...accessFilter, ...filter }).populate('owner', 'name email organization');

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { name: 1 },
    size: { size: -1 },
    updated: { updatedAt: -1 },
  };
  query = query.sort(sortMap[sort] || sortMap.newest);

  const datasets = await query.exec();
  const datasetIds = datasets.map((dataset) => dataset._id);
  const duplicatePairs = datasetIds.length === 0
    ? []
    : await Duplicate.find({
      status: 'Confirmed',
      duplicateDataset: { $in: datasetIds },
    }).select('duplicateDataset').lean();
  const duplicatedIds = new Set(
    duplicatePairs.map((pair) => String(pair.duplicateDataset))
  );
  const withAccess = await Promise.all(
    datasets.map(async (dataset) => ({
      ...dataset.toObject(),
      access: await getDatasetAccess(req.user, dataset),
      isDuplicate: duplicatedIds.has(String(dataset._id)),
    }))
  );

  res.json({ datasets: withAccess, count: withAccess.length });
}

async function getDataset(req, res) {
  const dataset = await Dataset.findById(req.params.id).populate('owner', 'name email organization');
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset, { hideUnauthorized: true });
  if (!access) return;

  const duplicateRelationship = await Duplicate.findOne({
    status: 'Confirmed',
    duplicateDataset: dataset._id,
  }).populate('originalDataset', 'name');

  res.json({ dataset, access, duplicateRelationship });
}

async function createDataset(req, res) {
  const { name, description, type, domain, tags, visibility, metadata, organization } = req.body;
  if (!name) return res.status(400).json({ message: 'Dataset name is required' });

  const dataset = await Dataset.create({
    name,
    description: description || '',
    owner: req.user._id,
    organization: organization || req.user.organization,
    type: type || 'Other',
    domain: domain || 'Other',
    visibility: visibility || 'Private',
    tags: tags || [],
    metadata: metadata || {},
    status: 'Draft',
    lifecycle: { create: true },
  });

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'created',
    description: `${req.user.name} created dataset "${dataset.name}"`,
  });

  res.status(201).json({ dataset, access: { permission: 'Owner', canView: true, canEdit: true, canUpload: true, canValidate: true, canMetadataEdit: true, canManageAccess: true, canArchive: true, canDelete: true, canManageLifecycle: true, canDownloadFiles: true } });
}

async function updateDataset(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Editor');
  if (!access) return;

  if (req.body.owner !== undefined) {
    return res.status(403).json({ message: 'Owner cannot be changed through dataset update' });
  }

  const restrictedFields = ['visibility', 'organization', 'status'];
  const hasRestrictedChange = restrictedFields.some((field) => req.body[field] !== undefined);
  if (hasRestrictedChange && access.permission !== 'Owner') {
    return res.status(403).json({ message: 'Only the owner can change visibility, organization, or status' });
  }

  const allowedFields = ['name', 'description', 'type', 'domain', 'tags'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) dataset[field] = req.body[field];
  });

  if (req.body.visibility !== undefined) dataset.visibility = req.body.visibility;
  if (req.body.organization !== undefined) dataset.organization = req.body.organization;
  if (req.body.status !== undefined) dataset.status = req.body.status;

  await dataset.save();
  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'updated',
    description: `${req.user.name} updated dataset "${dataset.name}"`,
  });

  const refreshedAccess = await requireDatasetAccess(req, res, dataset);
  res.json({ dataset, access: refreshedAccess });
}

async function deleteDataset(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Owner');
  if (!access) return;

  const versions = await DatasetVersion.find({ dataset: dataset._id }).lean();
  await Promise.all(
    versions.flatMap((version) => (version.files || []).map((file) => deleteFile(file).catch((error) => {
      console.error(`[storage] failed to delete ${file.originalName || file.storedName}:`, error.message);
    })))
  );
  await DatasetVersion.deleteMany({ dataset: dataset._id });
  await Collaboration.deleteMany({ dataset: dataset._id });
  await dataset.deleteOne();

  recordSnapshot();

  res.json({ message: 'Dataset deleted' });
}

async function archiveDataset(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Owner');
  if (!access) return;

  dataset.status = 'Archived';
  dataset.lifecycle.archive = true;
  await dataset.save();

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'archived',
    description: `${req.user.name} archived dataset "${dataset.name}"`,
  });

  recordSnapshot();

  res.json({ dataset, access: await requireDatasetAccess(req, res, dataset) });
}

async function restoreDataset(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Owner');
  if (!access) return;

  dataset.status = 'Active';
  dataset.lifecycle.archive = false;
  await dataset.save();

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'restored',
    description: `${req.user.name} restored dataset "${dataset.name}"`,
  });

  recordSnapshot();

  res.json({ dataset, access: await requireDatasetAccess(req, res, dataset) });
}

async function retireDataset(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Owner');
  if (!access) return;

  const { reason } = req.body;
  dataset.status = 'Retired';
  dataset.lifecycle.retire = true;
  dataset.retiredInfo = { retiredAt: new Date(), reason: reason || 'No longer maintained' };
  await dataset.save();

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'retired',
    description: `${req.user.name} retired dataset "${dataset.name}"`,
  });

  recordSnapshot();

  res.json({ dataset, access: await requireDatasetAccess(req, res, dataset) });
}

async function shareDataset(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Owner');
  if (!access) return;

  const { userId, permission, visibility } = req.body;
  if (userId && String(userId) === String(req.user._id)) {
    return res.status(400).json({ message: 'The owner already has full access to the dataset' });
  }
  if (permission === 'Owner') {
    return res.status(400).json({ message: 'Owner assignment is not allowed through the share endpoint; transfer ownership is not supported here.' });
  }

  dataset.lifecycle.share = true;
  if (visibility) {
    dataset.visibility = visibility;
  }
  await dataset.save();

  if (userId) {
    const collab = await Collaboration.findOneAndUpdate(
      { dataset: dataset._id, user: userId },
      { permission: permission || 'Viewer' },
      { upsert: true, new: true }
    );
    await notify({
      user: userId,
      type: 'share',
      message: `You were given ${collab.permission} access to "${dataset.name}"`,
      dataset: dataset._id,
    });
    await logActivity({
      user: req.user._id,
      dataset: dataset._id,
      action: 'shared',
      description: `${req.user.name} shared "${dataset.name}" with a collaborator`,
    });
  }

  res.json({ dataset, access: await requireDatasetAccess(req, res, dataset) });
}

async function serveDatasetFile(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canDownloadFiles) {
    return res.status(403).json({ message: 'You do not have permission to access this dataset file' });
  }

  const fileName = req.params.filename;
  const version = await DatasetVersion.findOne({
    dataset: dataset._id,
    files: { $elemMatch: { $or: [{ storedName: fileName }, { cloudStorageId: fileName }, { storageKey: fileName }] } },
  }).lean();
  const fileInfo = version?.files?.find((file) => [file.storedName, file.cloudStorageId, file.storageKey].includes(fileName));

  if (!version || !fileInfo) {
    return res.status(404).json({ message: 'File not found' });
  }

  const storedFile = await downloadFile(fileInfo);
  if (!storedFile) return res.status(404).json({ message: 'File not found' });

  const downloadName = String(fileInfo.originalName || 'download').replace(/[\r\n"\\]/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  if (storedFile.contentType) res.setHeader('Content-Type', storedFile.contentType);
  if (storedFile.contentLength !== undefined) res.setHeader('Content-Length', storedFile.contentLength);
  storedFile.stream.on('error', (error) => {
    if (!res.headersSent) res.status(404).json({ message: 'File not found' });
    else res.destroy(error);
  });
  storedFile.stream.pipe(res);
}

async function getCitations(req, res) {
  const dataset = await Dataset.findById(req.params.id).populate('owner', 'name');
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canView) {
    return res.status(404).json({ message: 'Dataset not found' });
  }

  const year = new Date(dataset.createdAt).getFullYear();
  const ownerName = dataset.owner?.name || 'Unknown Author';
  const citation = `${ownerName}. (${year}). ${dataset.name}. DataMeridian. Version ${dataset.currentVersion}. ${dataset.doi || `https://doi.org/10.5281/datameridian.${dataset._id}`}`;

  res.json({
    citation,
    apa: citation,
    doi: dataset.doi || `10.5281/datameridian.${dataset._id}`,
    citationCount: dataset.citationCount,
  });
}

module.exports = {
  listDatasets,
  getDataset,
  createDataset,
  updateDataset,
  deleteDataset,
  archiveDataset,
  restoreDataset,
  retireDataset,
  shareDataset,
  serveDatasetFile,
  getCitations,
};
