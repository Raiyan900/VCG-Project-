const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: String, default: '' },
    type: { type: String, default: 'Other' },
    domain: {
      type: String,
      enum: ['Genomics', 'Proteomics', 'Imaging', 'Clinical', 'Transcriptomics', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Validating', 'Archived', 'Retired'],
      default: 'Draft',
    },
    visibility: {
      type: String,
      enum: ['Public', 'Organization', 'Private', 'Restricted'],
      default: 'Private',
    },
    size: { type: Number, default: 0 }, // bytes
    tags: [{ type: String }],
    metadata: {
      organism: { type: String, default: '' },
      collectionMethod: { type: String, default: '' },
      license: { type: String, default: '' },
      keywords: [{ type: String }],
      authors: [{ type: String }],
      institution: { type: String, default: '' },
      contact: { type: String, default: '' },
    },
    currentVersion: { type: String, default: '1.0' },
    citationCount: { type: Number, default: 0 },
    doi: { type: String, default: '' },
    lifecycle: {
      create: { type: Boolean, default: true },
      validate: { type: Boolean, default: false },
      version: { type: Boolean, default: false },
      share: { type: Boolean, default: false },
      archive: { type: Boolean, default: false },
      retire: { type: Boolean, default: false },
    },
    retiredInfo: {
      retiredAt: Date,
      reason: String,
    },
  },
  { timestamps: true }
);

datasetSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Dataset', datasetSchema);
