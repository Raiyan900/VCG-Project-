const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Dataset = require('../models/Dataset');
const DatasetVersion = require('../models/DatasetVersion');
const User = require('../models/User');
const StorageSnapshot = require('../models/StorageSnapshot');

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');
const SNAPSHOT_THROTTLE_MS = 60 * 1000; // avoid flooding history with near-duplicate snapshots
const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
const S3_BUCKET = process.env.S3_BUCKET;
const s3 = STORAGE_PROVIDER === 'cloud'
  ? new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    })
  : null;
const configuredCapacityGB = Number(process.env.STORAGE_CAPACITY_GB);
const STORAGE_CAPACITY_BYTES = Number.isFinite(configuredCapacityGB) && configuredCapacityGB > 0
  ? configuredCapacityGB * 1024 * 1024 * 1024
  : null;

function assertCloudConfiguration() {
  if (!S3_BUCKET || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    throw new Error('Cloud storage is not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.');
  }
}

function safeFileName(name) {
  return path.basename(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildStorageKey(datasetId, version, originalName) {
  return `datasets/${datasetId}/versions/${version}/${crypto.randomUUID()}-${safeFileName(originalName)}`;
}

async function uploadFile(file, { datasetId, version }) {
  const originalName = file.originalname;
  const size = file.size;
  const mimeType = file.mimetype || 'application/octet-stream';

  if (STORAGE_PROVIDER === 'local') {
    return {
      storageProvider: 'local',
      storageKey: file.filename,
      localPath: file.path,
      cloudStorageId: null,
      storedName: file.filename,
      originalName,
      size,
      mimeType,
    };
  }

  if (STORAGE_PROVIDER !== 'cloud') throw new Error(`Unsupported storage provider: ${STORAGE_PROVIDER}`);
  assertCloudConfiguration();
  const storageKey = buildStorageKey(datasetId, version, originalName);
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: storageKey,
    Body: file.buffer,
    ContentLength: size,
    ContentType: mimeType,
    ContentDisposition: `attachment; filename="${safeFileName(originalName)}"`,
  }));

  return {
    storageProvider: 'cloud',
    storageKey,
    cloudStorageId: storageKey,
    storedName: storageKey,
    originalName,
    size,
    mimeType,
  };
}

function localFilePath(file) {
  const storedName = path.basename(file.storedName || file.localPath || file.path || '');
  if (!storedName) return null;
  const absolutePath = path.join(UPLOAD_DIR, storedName);
  const relativePath = path.relative(UPLOAD_DIR, absolutePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return null;
  return absolutePath;
}

async function downloadFile(file) {
  if (file.cloudStorageId || file.storageProvider === 'cloud') {
    assertCloudConfiguration();
    try {
      const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: file.cloudStorageId || file.storageKey }));
      return { stream: response.Body, contentType: response.ContentType, contentLength: response.ContentLength };
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) return null;
      throw error;
    }
  }

  const absolutePath = localFilePath(file);
  if (!absolutePath || !fsSync.existsSync(absolutePath)) return null;
  const stat = await fs.stat(absolutePath);
  return { stream: fsSync.createReadStream(absolutePath), contentType: file.mimeType, contentLength: stat.size };
}

async function deleteFile(file) {
  if (file.cloudStorageId || file.storageProvider === 'cloud') {
    assertCloudConfiguration();
    const key = file.cloudStorageId || file.storageKey;
    if (key) await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return;
  }
  const absolutePath = localFilePath(file);
  if (absolutePath) await fs.rm(absolutePath, { force: true });
}

async function getFileUrl(file, expiresIn = 300) {
  if (!file.cloudStorageId && file.storageProvider !== 'cloud') return null;
  assertCloudConfiguration();
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: file.cloudStorageId || file.storageKey }),
    { expiresIn }
  );
}

async function getPhysicalFileSize(file) {
  const storedName = file.cloudStorageId || file.storageKey || path.basename(file.storedName || file.path || '');
  if (!storedName) return null;

  if (file.cloudStorageId || file.storageProvider === 'cloud') return Number(file.size) || 0;

  try {
    const stat = await fs.stat(path.join(UPLOAD_DIR, storedName));
    return stat.isFile() ? stat.size : null;
  } catch {
    return null;
  }
}

async function buildDatasetStorageUsage(datasets, versions) {
  const versionsByDataset = new Map();
  for (const version of versions) {
    const key = String(version.dataset);
    if (!versionsByDataset.has(key)) versionsByDataset.set(key, []);
    versionsByDataset.get(key).push(version);
  }

  return Promise.all(datasets.map(async (dataset) => {
    const seenPaths = new Set();
    let storageBytes = 0;
    let fileCount = 0;
    const datasetVersions = versionsByDataset.get(String(dataset._id)) || [];

    for (const version of datasetVersions) {
      for (const file of version.files || []) {
        const storedName = file.cloudStorageId || file.storageKey || path.basename(file.storedName || file.path || '');
        if (!storedName || seenPaths.has(storedName)) continue;
        seenPaths.add(storedName);

        const size = await getPhysicalFileSize(file);
        if (size === null) continue;
        storageBytes += size;
        fileCount += 1;
      }
    }

    return {
      datasetId: dataset._id,
      owner: dataset.owner,
      name: dataset.name,
      domain: dataset.domain,
      organization: dataset.organization,
      status: dataset.status,
      storageBytes,
      fileCount,
    };
  }));
}

async function getDatasetStorageUsage(ownerId) {
  const datasetFilter = ownerId ? { owner: ownerId } : {};
  const [datasets, versions] = await Promise.all([
    Dataset.find(datasetFilter).select('owner name domain organization status').lean(),
    DatasetVersion.find({}).select('dataset files').sort({ createdAt: 1 }).lean(),
  ]);

  const ownerIds = datasets.map((dataset) => dataset.owner).filter(Boolean);
  const owners = await User.find({ _id: { $in: ownerIds } }).select('organization').lean();
  const ownerOrganizations = new Map(owners.map((owner) => [String(owner._id), owner.organization || '']));
  datasets.forEach((dataset) => {
    dataset.organization = ownerOrganizations.get(String(dataset.owner)) || '';
  });

  return buildDatasetStorageUsage(datasets, versions);
}

async function computeStorageBreakdown(ownerId) {
  const datasetUsage = await getDatasetStorageUsage(ownerId);

  let totalBytes = 0;
  let versionBytes = 0;
  let fileCount = 0;
  const byStatus = { Draft: 0, Active: 0, Validating: 0, Archived: 0, Retired: 0 };
  let largestDataset = null;

  for (const dataset of datasetUsage) {
    totalBytes += dataset.storageBytes;
    versionBytes += dataset.storageBytes;
    fileCount += dataset.fileCount;
    byStatus[dataset.status] = (byStatus[dataset.status] || 0) + dataset.storageBytes;

    if (!largestDataset || dataset.storageBytes > largestDataset.sizeBytes) {
      largestDataset = { datasetId: dataset.datasetId, sizeBytes: dataset.storageBytes };
    }
  }

  return {
    totalBytes,
    activeBytes: byStatus.Active,
    archivedBytes: byStatus.Archived,
    retiredBytes: byStatus.Retired,
    draftBytes: byStatus.Draft,
    validatingBytes: byStatus.Validating,
    versionBytes,
    datasetCount: datasetUsage.length,
    fileCount,
    largestDataset,
    averageDatasetSize: datasetUsage.length ? Math.round(totalBytes / datasetUsage.length) : 0,
    availableBytes: STORAGE_CAPACITY_BYTES === null ? null : Math.max(0, STORAGE_CAPACITY_BYTES - totalBytes),
    capacityBytes: STORAGE_CAPACITY_BYTES,
    provider: STORAGE_PROVIDER,
    datasetUsage,
  };
}

async function getUserStorageBreakdown(userId) {
  const userFilter = userId ? { _id: userId } : {};
  const users = await User.find(userFilter).select('name email organization').sort({ name: 1, email: 1 }).lean();
  const usage = await getDatasetStorageUsage();
  const usageByOwner = new Map();

  for (const dataset of usage) {
    const ownerId = String(dataset.owner);
    const current = usageByOwner.get(ownerId) || {
      storageBytes: 0,
      datasetCount: 0,
      fileCount: 0,
      datasets: [],
    };
    current.storageBytes += dataset.storageBytes;
    current.datasetCount += 1;
    current.fileCount += dataset.fileCount;
    current.datasets.push({
      datasetId: dataset.datasetId,
      name: dataset.name,
      storageBytes: dataset.storageBytes,
      fileCount: dataset.fileCount,
    });
    usageByOwner.set(ownerId, current);
  }

  return users.map((user) => {
    const current = usageByOwner.get(String(user._id)) || {
      storageBytes: 0,
      datasetCount: 0,
      fileCount: 0,
      datasets: [],
    };
    return {
      userId: user._id,
      username: user.name,
      email: user.email,
      organization: user.organization,
      storageBytes: current.storageBytes,
      datasetCount: current.datasetCount,
      fileCount: current.fileCount,
      datasets: current.datasets,
    };
  });
}

/** Cross-check against actual bytes present on disk in the uploads directory. */
async function getActualDiskUsage() {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    let bytes = 0;
    for (const file of files) {
      try {
        const stat = await fs.stat(path.join(UPLOAD_DIR, file));
        if (stat.isFile()) bytes += stat.size;
      } catch {
        // file may have been removed concurrently; skip
      }
    }
    return { available: true, bytes };
  } catch (err) {
    return { available: false, bytes: 0, error: 'Upload directory unavailable' };
  }
}

/** Records a throttled point-in-time snapshot for the storage history chart. */
async function recordSnapshot() {
  try {
    const last = await StorageSnapshot.findOne({}).sort({ createdAt: -1 });
    if (last && Date.now() - new Date(last.createdAt).getTime() < SNAPSHOT_THROTTLE_MS) {
      return last;
    }
    const breakdown = await computeStorageBreakdown();
    return await StorageSnapshot.create({
      totalBytes: breakdown.totalBytes,
      activeBytes: breakdown.activeBytes,
      archivedBytes: breakdown.archivedBytes,
      retiredBytes: breakdown.retiredBytes,
      draftBytes: breakdown.draftBytes,
      validatingBytes: breakdown.validatingBytes,
      versionBytes: breakdown.versionBytes,
      datasetCount: breakdown.datasetCount,
      fileCount: breakdown.fileCount,
    });
  } catch (err) {
    console.error('[storage] failed to record snapshot:', err.message);
    return null;
  }
}

async function getHistory(limit = 60) {
  const snapshots = await StorageSnapshot.find({}).sort({ createdAt: 1 }).limit(limit).lean();
  return snapshots;
}

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  getFileUrl,
  computeStorageBreakdown,
  getUserStorageBreakdown,
  getActualDiskUsage,
  recordSnapshot,
  getHistory,
};
