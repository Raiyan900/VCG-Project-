const mongoose = require('mongoose');

const duplicateSchema = new mongoose.Schema(
  {
    datasetA: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    datasetB: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    originalDataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', default: null },
    duplicateDataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', default: null },
    similarity: { type: Number, required: true },
    category: {
      type: String,
      enum: ['Exact Duplicate', 'Likely Duplicate', 'Related Dataset'],
      default: 'Related Dataset',
    },
    matchedByHash: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Unresolved', 'Confirmed', 'Ignored'],
      default: 'Unresolved',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Duplicate', duplicateSchema);
