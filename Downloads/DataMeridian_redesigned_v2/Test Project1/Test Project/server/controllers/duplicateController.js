const Dataset = require('../models/Dataset');
const DatasetVersion = require('../models/DatasetVersion');
const Duplicate = require('../models/Duplicate');
const { detectDuplicates } = require('../services/aiService');
const logActivity = require('../utils/logActivity');
const { buildDatasetAccessFilter, getDatasetAccess } = require('../middleware/datasetAccess');

function isAdmin(user) {
  return user?.role === 'admin';
}

function canManageDataset(user, access) {
  return isAdmin(user) || access?.permission === 'Owner';
}

async function listDuplicates(req, res) {
  const accessFilter = await buildDatasetAccessFilter(req.user);
  const duplicateList = await Duplicate.find({
    $or: [
      { datasetA: accessFilter.$or?.[0] ? { $in: await Dataset.find(accessFilter).distinct('_id') } : { $exists: true } },
      { datasetB: accessFilter.$or?.[0] ? { $in: await Dataset.find(accessFilter).distinct('_id') } : { $exists: true } },
    ],
  })
    .populate('datasetA', 'name domain owner')
    .populate('datasetB', 'name domain owner')
    .populate('originalDataset', 'name domain owner')
    .populate('duplicateDataset', 'name domain owner')
    .sort({ similarity: -1 });
  const normalizedDuplicates = duplicateList.map((duplicate) => {
    const item = duplicate.toObject();
    // Confirmed records from before directional confirmation are potential pairs.
    if (item.status === 'Confirmed' && !item.originalDataset && !item.duplicateDataset) {
      item.status = 'Unresolved';
    }
    return item;
  });
  res.json({ duplicates: normalizedDuplicates, count: normalizedDuplicates.length });
}

async function scanForDuplicates(req, res) {
  const accessFilter = await buildDatasetAccessFilter(req.user);
  const datasets = await Dataset.find({ ...accessFilter, status: { $ne: 'Retired' } }).limit(200).lean();

  // Attach each dataset's current-version file hashes so exact physical
  // duplicates can be detected, rather than relying on name similarity alone.
  const versions = await DatasetVersion.find({ dataset: { $in: datasets.map((d) => d._id) } })
    .select('dataset files createdAt')
    .sort({ createdAt: -1 })
    .lean();
  const latestFilesByDataset = new Map();
  for (const v of versions) {
    const key = String(v.dataset);
    if (!latestFilesByDataset.has(key)) latestFilesByDataset.set(key, v.files || []);
  }
  const enriched = datasets.map((d) => ({
    ...d,
    fileHashes: (latestFilesByDataset.get(String(d._id)) || []).map((f) => f.hash).filter(Boolean),
  }));

  const { pairs } = detectDuplicates(enriched);

  const created = [];
  for (const pair of pairs) {
    const existing = await Duplicate.findOne({
      $or: [
        { datasetA: pair.datasetA, datasetB: pair.datasetB },
        { datasetA: pair.datasetB, datasetB: pair.datasetA },
      ],
    });
    if (existing) {
      existing.similarity = pair.similarity;
      existing.category = pair.category;
      existing.matchedByHash = pair.matchedByHash;
      await existing.save();
    } else {
      const dup = await Duplicate.create(pair);
      created.push(dup);
    }
  }

  res.json({ message: `Scan complete. ${created.length} new potential duplicate pair(s) found.`, created });
}

async function resolveDuplicate(req, res) {
  const duplicate = await Duplicate.findById(req.params.id);
  if (!duplicate) return res.status(404).json({ message: 'Duplicate record not found' });

  const accessibleIds = await Dataset.find(await buildDatasetAccessFilter(req.user)).distinct('_id');
  if (!accessibleIds.some((id) => String(id) === String(duplicate.datasetA) || String(id) === String(duplicate.datasetB))) {
    return res.status(403).json({ message: 'You are not allowed to manage this duplicate record' });
  }

  const { status, originalDataset, duplicateDataset } = req.body;
  if (!['Confirmed', 'Ignored'].includes(status)) {
    return res.status(400).json({ message: 'Duplicate status must be Confirmed or Ignored' });
  }

  const pairIds = [String(duplicate.datasetA), String(duplicate.datasetB)];
  if (status === 'Confirmed') {
    if (!originalDataset || !duplicateDataset || originalDataset === duplicateDataset) {
      return res.status(400).json({ message: 'Select distinct original and duplicate datasets' });
    }
    if (!pairIds.includes(String(originalDataset)) || !pairIds.includes(String(duplicateDataset))) {
      return res.status(400).json({ message: 'The selected datasets are not part of this potential duplicate pair' });
    }

    const duplicateTarget = await Dataset.findById(duplicateDataset);
    if (!duplicateTarget) return res.status(404).json({ message: 'Duplicate dataset not found' });
    const targetAccess = await getDatasetAccess(req.user, duplicateTarget);
    if (!canManageDataset(req.user, targetAccess)) {
      return res.status(403).json({ message: 'Only the duplicate dataset owner or an administrator can confirm this relationship' });
    }

    duplicate.originalDataset = originalDataset;
    duplicate.duplicateDataset = duplicateDataset;
  } else {
    const managedIds = [duplicate.duplicateDataset, duplicate.datasetA, duplicate.datasetB].filter(Boolean);
    const managedDatasets = await Dataset.find({ _id: { $in: managedIds } });
    let authorized = isAdmin(req.user);
    for (const dataset of managedDatasets) {
      const access = await getDatasetAccess(req.user, dataset);
      if (canManageDataset(req.user, access)) {
        authorized = true;
        break;
      }
    }
    if (!authorized) {
      return res.status(403).json({ message: 'Only an authorized dataset owner or administrator can remove this duplicate relationship' });
    }
    duplicate.originalDataset = null;
    duplicate.duplicateDataset = null;
  }

  duplicate.status = status;
  await duplicate.save();

  await logActivity({
    user: req.user._id,
    action: 'duplicate-resolved',
    description: `${req.user.name} marked a duplicate pair as ${duplicate.status}`,
  });

  res.json({ duplicate });
}

module.exports = { listDuplicates, scanForDuplicates, resolveDuplicate };
