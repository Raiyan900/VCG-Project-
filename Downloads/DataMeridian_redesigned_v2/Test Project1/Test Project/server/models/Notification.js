const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'validation',
        'collaborator',
        'version',
        'duplicate',
        'metadata',
        'share',
        'system',
      ],
      default: 'system',
    },
    message: { type: String, required: true },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
