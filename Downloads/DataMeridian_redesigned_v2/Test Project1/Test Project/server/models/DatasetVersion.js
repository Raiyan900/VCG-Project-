const mongoose = require('mongoose');

const datasetVersionSchema = new mongoose.Schema(
  {
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    version: { type: String, required: true },
    files: [
      {
        originalName: String,
        storedName: String,
        size: Number,
        mimeType: String,
        path: String,
        localPath: String,
        storageProvider: String,
        storageKey: String,
        cloudStorageId: String,
        hash: String,
      },
    ],
    changes: { type: String, default: '' },
    size: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    validationStatus: {
      type: String,
      enum: ['Pending', 'Passed', 'Warning', 'Failed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DatasetVersion', datasetVersionSchema);
