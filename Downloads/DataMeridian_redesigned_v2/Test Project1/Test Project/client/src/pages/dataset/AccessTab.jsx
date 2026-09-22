import { useEffect, useMemo, useState } from 'react';
import { Lock, Globe, Building2, Shield, UserPlus, Trash2, Pencil, Check } from 'lucide-react';
import { datasetService, userService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const VISIBILITIES = [
  { value: 'Public', icon: Globe, desc: 'Anyone can discover and view this dataset' },
  { value: 'Organization', icon: Building2, desc: 'Visible to members of your organization' },
  { value: 'Private', icon: Lock, desc: 'Only you and invited collaborators' },
  { value: 'Restricted', icon: Shield, desc: 'Requires explicit access approval' },
];

const PERMISSION_OPTIONS = ['Viewer', 'Contributor', 'Editor'];

function normalizeOwnerId(owner) {
  if (!owner) return null;
  if (typeof owner === 'string') return owner;
  return owner._id || owner.id || null;
}

export default function AccessTab({ dataset, onUpdate }) {
  const { user } = useAuth();
  const canManageAccess = Boolean(dataset.access?.canManageAccess);
  const currentPermission = dataset.access?.permission || 'None';
  const currentUserId = user?._id || user?.id || null;
  const ownerId = normalizeOwnerId(dataset.owner);
  const [visibility, setVisibility] = useState(dataset.visibility);
  const [saving, setSaving] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('Viewer');
  const [changingId, setChangingId] = useState(null);
  const [changePermission, setChangePermission] = useState('Viewer');
  const toast = useToast();

  function loadCollaborators() {
    if (!dataset?._id) return;
    datasetService.collaborators(dataset._id).then((collabData) => {
      setCollaborators(collabData.collaborators || []);
    });
  }

  useEffect(() => {
    setVisibility(dataset.visibility);
    loadCollaborators();
  }, [dataset._id, dataset.visibility]);

  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      setUsers([]);
      return undefined;
    }

    const timer = setTimeout(() => {
      userService.search(query).then((data) => setUsers(data.users || []));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function updateVisibility(value) {
    setVisibility(value);
    setSaving(true);
    try {
      const { dataset: updated, access } = await datasetService.update(dataset._id, { visibility: value });
      onUpdate({ ...updated, access });
      toast.success(`Visibility updated to ${value}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update visibility');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCollaborator() {
    if (!selectedUserId) {
      toast.error('Select a user to add');
      return;
    }

    try {
      await datasetService.addCollaborator(dataset._id, { userId: selectedUserId, permission: selectedPermission });
      toast.success('Collaborator added');
      setAddOpen(false);
      setSelectedUserId('');
      setSelectedPermission('Viewer');
      setSearchTerm('');
      loadCollaborators();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add collaborator');
    }
  }

  async function handlePermissionChange(collabId, permission) {
    try {
      await datasetService.updateCollaborator(dataset._id, collabId, { permission });
      toast.success(`Permission updated to ${permission}`);
      loadCollaborators();
      setChangingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permission');
    }
  }

  async function handleRemoveCollaborator(collabId) {
    try {
      await datasetService.removeCollaborator(dataset._id, collabId);
      toast.success('Collaborator removed');
      loadCollaborators();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove collaborator');
    }
  }

  const existingCollaboratorIds = useMemo(
    () => collaborators.map((collab) => (typeof collab.user === 'string' ? collab.user : collab.user?._id)).filter(Boolean),
    [collaborators]
  );

  const filteredUsers = users.filter((u) => {
    const id = u._id || u.id;
    if (!id || id === ownerId || existingCollaboratorIds.includes(id)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink-50">Current Permission</h3>
          <span className="badge border border-accent-green/30 bg-accent-green/10 text-accent-green">{currentPermission}</span>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-50">Dataset Visibility</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {VISIBILITIES.map((v) => (
            <button
              key={v.value}
              disabled={saving || !canManageAccess}
              onClick={() => updateVisibility(v.value)}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                visibility === v.value ? 'border-accent-green bg-accent-green/5' : 'border-surface-600/60 hover:border-surface-500'
              }`}
            >
              <v.icon size={18} className={visibility === v.value ? 'text-accent-green' : 'text-ink-400'} />
              <div>
                <p className="text-sm font-medium text-ink-100">{v.value}</p>
                <p className="mt-0.5 text-xs text-ink-500">{v.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink-50">People with access</h3>
          {canManageAccess && (
            <button onClick={() => setAddOpen(true)} className="btn-ghost text-accent-green">
              <UserPlus size={15} /> Add Collaborator
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-surface-600/60 bg-surface-800/40 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-ink-100">{dataset.owner?.name || 'Owner'}</p>
              <p className="text-xs text-ink-500">{ownerId === currentUserId ? 'You' : 'Dataset owner'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge border border-accent-green/30 bg-accent-green/10 text-accent-green">Owner</span>
            </div>
          </div>

          {collaborators.length === 0 ? (
            <p className="py-3 text-sm text-ink-500">No additional collaborators.</p>
          ) : (
            collaborators.map((collab) => {
              const userInfo = collab.user || {};
              const userName = userInfo.name || 'User';
              const collabPermission = collab.permission || 'Viewer';
              const isChanging = changingId === collab._id;

              return (
                <div key={collab._id} className="flex flex-col gap-2 rounded-lg border border-surface-600/60 bg-surface-800/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-100">{userName}</p>
                    <p className="text-xs text-ink-500">{userInfo.organization || 'Collaborator'}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isChanging ? (
                      <span className="badge border border-accent-green/30 bg-accent-green/10 text-accent-green">{collabPermission}</span>
                    ) : (
                      <select
                        className="input-field min-w-[110px] py-1.5 text-sm"
                        value={changePermission}
                        onChange={(e) => setChangePermission(e.target.value)}
                      >
                        {PERMISSION_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}

                    {canManageAccess && (
                      <>
                        {!isChanging ? (
                          <button
                            onClick={() => {
                              setChangingId(collab._id);
                              setChangePermission(collabPermission);
                            }}
                            className="btn-ghost text-accent-green"
                          >
                            <Pencil size={14} /> Change Permission
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePermissionChange(collab._id, changePermission)}
                            className="btn-ghost text-accent-green"
                          >
                            <Check size={14} /> Save
                          </button>
                        )}
                        <button onClick={() => handleRemoveCollaborator(collab._id)} className="btn-ghost text-accent-danger">
                          <Trash2 size={14} /> Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-50">Permission Levels</h3>
        <p className="mt-1 text-xs text-ink-500">Informational guide to effective permissions for this dataset.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { level: 'Viewer', text: 'View dataset only' },
            { level: 'Contributor', text: 'View + upload content' },
            { level: 'Editor', text: 'View + edit + validate' },
            { level: 'Owner', text: 'Full control and access management' },
          ].map((item) => (
            <div key={item.level} className="rounded-lg border border-surface-600/60 bg-surface-800/30 p-3 text-left">
              <p className="text-sm font-medium text-ink-100">{item.level}</p>
              <p className="mt-1 text-xs text-ink-500">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {canManageAccess && addOpen && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-50">Add Collaborator</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label-text">Search user</label>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user..."
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Permission</label>
              <select
                className="input-field"
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value)}
              >
                {PERMISSION_OPTIONS.map((permission) => (
                  <option key={permission} value={permission}>{permission}</option>
                ))}
              </select>
            </div>

            <div className="max-h-44 overflow-y-auto rounded-lg border border-surface-600/60 bg-surface-800/30 p-2">
              {searchTerm.trim().length < 2 ? (
                <p className="text-sm text-ink-500">Type at least 2 characters to search users.</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-ink-500">No matching users available.</p>
              ) : (
                filteredUsers.map((userEntry) => (
                  <button
                    type="button"
                    key={userEntry._id || userEntry.id}
                    onClick={() => setSelectedUserId(userEntry._id || userEntry.id)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      selectedUserId === (userEntry._id || userEntry.id)
                        ? 'bg-accent-green/10 text-accent-green'
                        : 'text-ink-200 hover:bg-surface-700/60'
                    }`}
                  >
                    <span>
                      <span className="block">{userEntry.name}</span>
                      <span className="block text-xs text-ink-500">{userEntry.email}</span>
                    </span>
                    <span className="text-xs text-ink-500">{userEntry.organization || 'No organization'}</span>
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setAddOpen(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="button" onClick={handleAddCollaborator} className="btn-primary flex-1">Add Collaborator</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
