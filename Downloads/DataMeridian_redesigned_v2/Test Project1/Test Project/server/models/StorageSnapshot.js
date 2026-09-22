const mongoose = require('mongoose');

const storageSnapshotSchema = new mongoose.Schema(
  {
    totalBytes: { type: Number, required: true },
    activeBytes: { type: Number, default: 0 },
    archivedBytes: { type: Number, default: 0 },
    retiredBytes: { type: Number, default: 0 },
    draftBytes: { type: Number, default: 0 },
    validatingBytes: { type: Number, default: 0 },
    versionBytes: { type: Number, default: 0 },
    datasetCount: { type: Number, default: 0 },
    fileCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StorageSnapshot', storageSnapshotSchema);
