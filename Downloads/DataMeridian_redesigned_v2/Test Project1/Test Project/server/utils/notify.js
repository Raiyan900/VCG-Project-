const Notification = require('../models/Notification');

async function notify({ user, type, message, dataset }) {
  try {
    await Notification.create({ user, type, message, dataset });
  } catch (err) {
    console.error('[notification] failed to create:', err.message);
  }
}

module.exports = notify;
