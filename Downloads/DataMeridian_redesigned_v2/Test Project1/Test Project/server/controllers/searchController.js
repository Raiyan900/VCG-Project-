const Dataset = require('../models/Dataset');
const User = require('../models/User');
const { buildDatasetAccessFilter } = require('../middleware/datasetAccess');

async function globalSearch(req, res) {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.json({ datasets: [], users: [], tags: [], domains: [] });
  }

  const regex = new RegExp(q, 'i');
  const accessFilter = await buildDatasetAccessFilter(req.user);

  const [datasets, users] = await Promise.all([
    Dataset.find({
      ...accessFilter,
      $or: [{ name: regex }, { description: regex }, { tags: regex }, { domain: regex }],
    })
      .limit(10)
      .select('name description domain type status visibility owner organization'),
    User.find({ $or: [{ name: regex }, { organization: regex }] })
      .limit(10)
      .select('name organization'),
  ]);

  res.json({ datasets, users });
}

module.exports = { globalSearch };
