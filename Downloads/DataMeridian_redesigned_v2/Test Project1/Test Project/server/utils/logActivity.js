const Activity = require('../models/Activity');

async function logActivity({ user, dataset, action, description }) {
  try {
    await Activity.create({ user, dataset, action, description });
  } catch (err) {
    console.error('[activity] failed to log:', err.message);
  }
}

module.exports = logActivity;
