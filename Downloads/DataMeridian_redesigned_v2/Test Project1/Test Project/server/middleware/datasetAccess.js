const Collaboration = require('../models/Collaboration');

const PERMISSION_LEVELS = {
  Viewer: 1,
  Contributor: 2,
  Editor: 3,
  Owner: 4,
};

function normalizeUserId(user) {
  if (!user) return null;
  return String(user._id || user.id || user);
}

function permissionRank(permission) {
  return PERMISSION_LEVELS[permission] || 0;
}

function hasMinimumPermission(currentPermission, requiredPermission) {
  if (!requiredPermission) return true;
  if (!currentPermission) return false;
  return permissionRank(currentPermission) >= permissionRank(requiredPermission);
}

async function getDatasetAccess(user, dataset, providedCollaboration) {
  const userId = normalizeUserId(user);

  const emptyAccess = {
    permission: null,
    canView: false,
    canEdit: false,
    canUpload: false,
    canValidate: false,
    canMetadataEdit: false,
    canManageAccess: false,
    canArchive: false,
    canRestore: false,
    canRetire: false,
    canDelete: false,
    canManageLifecycle: false,
    canDownloadFiles: false,
  };

  if (!user || !dataset) {
    return emptyAccess;
  }

  const ownerId = dataset.owner
    ? String(dataset.owner._id || dataset.owner)
    : null;
  const isOwner = Boolean(ownerId && userId && ownerId === userId);

  if (isOwner) {
    return {
      permission: 'Owner',
      canView: true,
      canEdit: true,
      canUpload: true,
      canValidate: true,
      canMetadataEdit: true,
      canManageAccess: true,
      canArchive: true,
      canRestore: true,
      canRetire: true,
      canDelete: true,
      canManageLifecycle: true,
      canDownloadFiles: true,
    };
  }

  let collaboration = providedCollaboration;
  if (!collaboration && userId && dataset?._id) {
    collaboration = await Collaboration.findOne({ dataset: dataset._id, user: userId }).lean();
  }

  const collaborationPermission = collaboration && collaboration.permission && collaboration.permission !== 'Owner'
    ? collaboration.permission
    : null;

  const sameOrganization = Boolean(
    user.organization && dataset.organization && String(user.organization) === String(dataset.organization)
  );

  let permission = collaborationPermission || null;

  if (!permission && dataset.visibility === 'Public') {
    permission = 'Viewer';
  }

  if (!permission && dataset.visibility === 'Organization' && sameOrganization) {
    permission = 'Viewer';
  }

  if (!permission && (dataset.visibility === 'Private' || dataset.visibility === 'Restricted')) {
    permission = null;
  }

  const canView = Boolean(permission);
  const canEdit = hasMinimumPermission(permission, 'Editor');
  const canUpload = hasMinimumPermission(permission, 'Contributor');
  const canValidate = hasMinimumPermission(permission, 'Editor');
  const canMetadataEdit = hasMinimumPermission(permission, 'Editor');
  const canManageAccess = permission === 'Owner';
  const canArchive = permission === 'Owner';
  const canDelete = permission === 'Owner';
  const canManageLifecycle = permission === 'Owner';
  const canDownloadFiles = canView;

  return {
    permission,
    canView,
    canEdit,
    canUpload,
    canValidate,
    canMetadataEdit,
    canManageAccess,
    canArchive,
    canRestore: permission === 'Owner',
    canRetire: permission === 'Owner',
    canDelete,
    canManageLifecycle,
    canDownloadFiles,
  };
}

async function getDatasetAccessForRequest(req, dataset, providedCollaboration) {
  return getDatasetAccess(req.user, dataset, providedCollaboration);
}

async function requireDatasetAccess(req, res, dataset, options = {}) {
  const access = await getDatasetAccessForRequest(req, dataset);
  const shouldHide = options.hideUnauthorized === undefined ? true : options.hideUnauthorized;

  if (!access.canView) {
    if (shouldHide) {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    return res.status(403).json({ message: 'You do not have access to this dataset' });
  }

  if (options.requiredPermission && !hasMinimumPermission(access.permission, options.requiredPermission)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' });
  }

  return access;
}

async function requireDatasetPermission(req, res, dataset, requiredPermission, options = {}) {
  return requireDatasetAccess(req, res, dataset, { ...options, requiredPermission });
}

function hasDatasetPermission(user, dataset, permission, providedCollaboration) {
  return getDatasetAccess(user, dataset, providedCollaboration).then((access) => {
    if (!permission) return access.canView;
    return hasMinimumPermission(access.permission, permission);
  });
}

async function buildDatasetAccessFilter(user) {
  const userId = normalizeUserId(user);
  if (!userId) {
    return { _id: null };
  }

  const collaboratorDatasetIds = await Collaboration.find({ user: userId }).distinct('dataset');
  const clauses = [
    { owner: userId },
    { _id: { $in: collaboratorDatasetIds } },
    { visibility: 'Public' },
  ];

  if (user.organization) {
    clauses.push({ visibility: 'Organization', organization: user.organization });
  }

  return { $or: clauses };
}

module.exports = {
  PERMISSION_LEVELS,
  getDatasetAccess,
  getDatasetAccessForRequest,
  requireDatasetAccess,
  requireDatasetPermission,
  hasDatasetPermission,
  buildDatasetAccessFilter,
  hasMinimumPermission,
};
