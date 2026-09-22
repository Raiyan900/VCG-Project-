const Collaboration = require('../models/Collaboration');
const Activity = require('../models/Activity');
const Dataset = require('../models/Dataset');
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');
const { requireDatasetAccess, requireDatasetPermission } = require('../middleware/datasetAccess');

async function listCollaborators(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });

  const collaborators = await Collaboration.find({ dataset: dataset._id }).populate(
    'user',
    'name email organization avatar'
  );
  res.json({ collaborators, access });
}

async function addCollaborator(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Owner');
  if (!access) return;

  const { userId, permission } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  if (String(userId) === String(req.user._id)) {
    return res.status(400).json({ message: 'You already own this dataset' });
  }
  if (String(userId) === String(dataset.owner)) {
    return res.status(400).json({ message: 'The dataset owner is already the owner' });
  }
  if (permission === 'Owner') {
    return res.status(400).json({ message: 'Owner assignment via collaborator endpoint is not allowed' });
  }

  const collaboration = await Collaboration.findOneAndUpdate(
    { dataset: dataset._id, user: userId },
    { permission: permission || 'Viewer' },
    { upsert: true, new: true }
  ).populate('user', 'name email organization avatar');

  await notify({
    user: userId,
    type: 'collaborator',
    message: `You were added as ${collaboration.permission} on "${dataset.name}"`,
    dataset: dataset._id,
  });

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'collaborator-added',
    description: `${req.user.name} added a collaborator to "${dataset.name}"`,
  });

  res.status(201).json({ collaboration, access });
}

async function updateCollaborator(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Owner');
  if (!access) return;

  const collab = await Collaboration.findOne({ _id: req.params.collabId, dataset: dataset._id });
  if (!collab) return res.status(404).json({ message: 'Collaborator not found' });
  if (String(collab.user) === String(dataset.owner)) {
    return res.status(400).json({ message: 'Cannot change the dataset owner permission' });
  }

  const { permission } = req.body;
  if (!permission) return res.status(400).json({ message: 'Permission is required' });
  if (!['Viewer', 'Contributor', 'Editor'].includes(permission)) {
    return res.status(400).json({ message: 'Invalid permission' });
  }

  collab.permission = permission;
  await collab.save();

  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'collaborator-updated',
    description: `${req.user.name} changed collaborator permissions for "${dataset.name}"`,
  });

  res.json({ collaboration: collab, access });
}

async function removeCollaborator(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetPermission(req, res, dataset, 'Owner');
  if (!access) return;

  const collab = await Collaboration.findOne({ _id: req.params.collabId, dataset: dataset._id });
  if (!collab) return res.status(404).json({ message: 'Collaborator not found' });
  if (String(collab.user) === String(dataset.owner)) {
    return res.status(400).json({ message: 'Cannot remove the dataset owner' });
  }

  await collab.deleteOne();
  await logActivity({
    user: req.user._id,
    dataset: dataset._id,
    action: 'collaborator-removed',
    description: `${req.user.name} removed a collaborator from "${dataset.name}"`,
  });
  res.json({ message: 'Collaborator removed' });
}

async function getActivity(req, res) {
  const dataset = await Dataset.findById(req.params.id);
  if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

  const access = await requireDatasetAccess(req, res, dataset);
  if (!access || !access.canView) return res.status(404).json({ message: 'Dataset not found' });

  const activity = await Activity.find({ dataset: dataset._id })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ activity, access });
}

module.exports = { listCollaborators, addCollaborator, updateCollaborator, removeCollaborator, getActivity };
