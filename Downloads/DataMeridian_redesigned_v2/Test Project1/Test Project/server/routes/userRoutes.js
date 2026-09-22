const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const protect = require('../middleware/auth');
const User = require('../models/User');
const { sanitizeUser } = require('../controllers/authController');

const router = express.Router();
router.use(protect);

router.get('/search', asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 2) return res.json({ users: [] });

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escapedQuery, 'i');
  const users = await User.find({
    $or: [{ name: matcher }, { email: matcher }],
  })
    .select('name email organization avatar')
    .sort({ name: 1, email: 1 })
    .limit(20)
    .lean();

  res.json({ users });
}));

router.get('/', asyncHandler(async (req, res) => {
  const users = await User.find({}).select('name email organization avatar');
  res.json({ users });
}));

router.put('/me', asyncHandler(async (req, res) => {
  const allowed = ['name', 'organization', 'researchAreas', 'avatar'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  res.json({ user: sanitizeUser(req.user) });
}));

module.exports = router;
