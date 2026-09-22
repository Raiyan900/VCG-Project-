const mongoose = require('mongoose');

const validationSchema = new mongoose.Schema(
  {
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
    version: { type: String, default: '1.0' },
    status: {
      type: String,
      enum: ['Pending', 'Passed', 'Warning', 'Failed'],
      default: 'Pending',
    },
    checks: [
      {
        name: String,
        passed: Boolean,
        message: String,
      },
    ],
    warnings: [{ type: String }],
    errors: [{ type: String }],
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Validation', validationSchema);
