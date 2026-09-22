const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema(
  {
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    permission: {
      type: String,
      enum: ['Viewer', 'Contributor', 'Editor', 'Owner'],
      default: 'Viewer',
    },
  },
  { timestamps: true }
);

collaborationSchema.index({ dataset: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Collaboration', collaborationSchema);
