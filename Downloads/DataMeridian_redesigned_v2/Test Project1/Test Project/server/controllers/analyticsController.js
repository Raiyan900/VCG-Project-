const Dataset = require('../models/Dataset');
const Duplicate = require('../models/Duplicate');
const {
  computeStorageBreakdown,
  getUserStorageBreakdown,
  getActualDiskUsage,
  recordSnapshot,
  getHistory,
} = require('../services/storageService');

async function dashboardAnalytics(req, res) {
  const datasetFilter = req.user.role === 'admin' ? {} : { owner: req.user._id };
  const ownedDatasetIds = req.user.role === 'admin' ? null : await Dataset.find(datasetFilter).distinct('_id');
  const duplicateFilter = req.user.role === 'admin'
    ? { status: 'Unresolved' }
    : { status: 'Unresolved', $or: [{ datasetA: { $in: ownedDatasetIds } }, { datasetB: { $in: ownedDatasetIds } }] };
  const [total, active, archived, retired, validating, duplicates] = await Promise.all([
    Dataset.countDocuments(datasetFilter),
    Dataset.countDocuments({ ...datasetFilter, status: 'Active' }),
    Dataset.countDocuments({ ...datasetFilter, status: 'Archived' }),
    Dataset.countDocuments({ ...datasetFilter, status: 'Retired' }),
    Dataset.countDocuments({ ...datasetFilter, status: 'Validating' }),
    Duplicate.countDocuments(duplicateFilter),
  ]);

  const byDomain = await Dataset.aggregate([
    { $match: datasetFilter },
    { $group: { _id: '$domain', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const breakdown = await computeStorageBreakdown(req.user.role === 'admin' ? undefined : req.user._id);

  // Growth over the last 8 months (based on createdAt)
  const growth = await Dataset.aggregate([
    { $match: datasetFilter },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 },
  ]);

  res.json({
    stats: {
      total,
      totalDatasets: total,
      active,
      activeDatasets: active,
      archived,
      archivedDatasets: archived,
      retired,
      validating,
      duplicates,
      duplicatesDetected: duplicates,
      storageBytes: breakdown.totalBytes,
    },
    byDomain,
    growth: growth.map((g) => ({
      label: `${g._id.year}-${String(g._id.month).padStart(2, '0')}`,
      count: g.count,
    })),
    lifecycleDistribution: [
      { name: 'Active', value: active },
      { name: 'Archived', value: archived },
      { name: 'Validating', value: validating },
      { name: 'Retired', value: retired },
    ],
  });
}

async function storageAnalytics(req, res) {
  const ownerId = req.user.role === 'admin' ? undefined : req.user._id;

  let breakdown;
  try {
    breakdown = await computeStorageBreakdown(ownerId);
  } catch (err) {
    return res.status(503).json({ message: 'Unable to calculate storage usage at this time.' });
  }

  // Ensure a history point exists without blocking the response for long.
  if (req.user.role === 'admin') recordSnapshot();

  const [diskUsage, history] = await Promise.all([
    getActualDiskUsage(),
    req.user.role === 'admin' ? getHistory(60) : Promise.resolve([]),
  ]);

  const byType = {};
  const byOrganization = {};
  breakdown.datasetUsage.forEach((dataset) => {
    byType[dataset.domain] = (byType[dataset.domain] || 0) + dataset.storageBytes;
    const org = dataset.organization || 'Unspecified';
    byOrganization[org] = (byOrganization[org] || 0) + dataset.storageBytes;
  });

  res.json({
    storageBytes: breakdown.totalBytes,
    totalBytes: breakdown.totalBytes,
    activeBytes: breakdown.activeBytes,
    archivedBytes: breakdown.archivedBytes,
    retiredBytes: breakdown.retiredBytes,
    draftBytes: breakdown.draftBytes,
    validatingBytes: breakdown.validatingBytes,
    versionStorageBytes: breakdown.versionBytes,
    availableBytes: breakdown.availableBytes,
    capacityBytes: breakdown.capacityBytes,
    datasetCount: breakdown.datasetCount,
    fileCount: breakdown.fileCount,
    averageDatasetSizeBytes: breakdown.averageDatasetSize,
    largestDataset: breakdown.largestDataset,
    provider: breakdown.provider,
    diskUsage: {
      available: diskUsage.available,
      actualBytesOnDisk: req.user.role === 'admin' ? diskUsage.bytes : breakdown.totalBytes,
    },
    byType: Object.entries(byType).map(([type, storageBytes]) => ({ type, storageBytes })),
    byOrganization: Object.entries(byOrganization).map(([org, storageBytes]) => ({ org, storageBytes })),
    history: history.map((h) => ({
      timestamp: h.createdAt,
      totalBytes: h.totalBytes,
      activeBytes: h.activeBytes,
      archivedBytes: h.archivedBytes,
      retiredBytes: h.retiredBytes,
    })),
    lastUpdated: new Date().toISOString(),
  });
}

function canViewUserStorage(req, userId) {
  return req.user.role === 'admin' || String(req.user._id) === String(userId);
}

async function storageUsersAnalytics(req, res) {
  const userId = req.user.role === 'admin' ? undefined : req.user._id;
  const users = await getUserStorageBreakdown(userId);
  res.json({ users });
}

async function storageUserDetails(req, res) {
  if (!canViewUserStorage(req, req.params.userId)) {
    return res.status(403).json({ message: 'You can only view your own storage details' });
  }

  const users = await getUserStorageBreakdown(req.params.userId);
  if (!users.length) return res.status(404).json({ message: 'User not found' });
  res.json({ user: users[0] });
}

module.exports = {
  dashboardAnalytics,
  storageAnalytics,
  storageUsersAnalytics,
  storageUserDetails,
};
