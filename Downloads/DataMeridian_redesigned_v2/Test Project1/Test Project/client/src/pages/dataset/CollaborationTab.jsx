import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { datasetService, userService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils/format';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';

const PERMISSIONS = ['Viewer', 'Contributor', 'Editor'];

export default function CollaborationTab({ dataset }) {
  const canManageAccess = Boolean(dataset.access?.canManageAccess);
  const [collaborators, setCollaborators] = useState([]);
  const [activity, setActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('Viewer');
  const toast = useToast();

  function load() {
    Promise.all([datasetService.collaborators(dataset._id), datasetService.activity(dataset._id)]).then(
      ([collabData, activityData]) => {
        setCollaborators(collabData.collaborators);
        setActivity(activityData.activity);
      }
    );
  }

  useEffect(load, [dataset._id]);

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

  async function addCollaborator() {
    if (!selectedUser) return toast.error('Select a user to add');
    try {
      await datasetService.addCollaborator(dataset._id, { userId: selectedUser, permission: selectedPermission });
      toast.success('Collaborator added');
      setModalOpen(false);
      setSelectedUser('');
      setSearchTerm('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add collaborator');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-50">Collaborators</h3>
          {canManageAccess && (
            <button onClick={() => setModalOpen(true)} className="btn-ghost text-accent-green">
              <UserPlus size={15} /> Add
            </button>
          )}
        </div>
        <div className="mt-3 space-y-2">
          {collaborators.length === 0 && <p className="py-4 text-center text-sm text-ink-500">No collaborators yet</p>}
          {collaborators.map((c) => (
            <div key={c._id} className="flex items-center justify-between rounded-lg bg-surface-800/50 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-green/15 text-xs font-semibold text-accent-green">
                  {c.user?.name?.[0] || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-100">{c.user?.name}</p>
                  <p className="text-xs text-ink-500">{c.user?.organization}</p>
                </div>
              </div>
              <span className="badge border border-accent-green/30 bg-accent-green/10 text-accent-green">{c.permission}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-50">Activity Timeline</h3>
        {activity.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-500">No activity recorded yet</p>
        ) : (
          <div className="mt-3 space-y-3">
            {activity.map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
                <div>
                  <p className="text-ink-200">{a.description}</p>
                  <p className="text-xs text-ink-500">{timeAgo(a.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Collaborator">
        <div className="space-y-4">
          <div>
            <label className="label-text">Search user</label>
            <input
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user..."
            />
            <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-surface-600/60 bg-surface-800/30 p-2">
              {searchTerm.trim().length < 2 ? (
                <p className="text-sm text-ink-500">Type at least 2 characters to search users.</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-ink-500">No matching users available.</p>
              ) : (
                users.map((u) => (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => setSelectedUser(u._id)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      selectedUser === u._id ? 'bg-accent-green/10 text-accent-green' : 'text-ink-200 hover:bg-surface-700/60'
                    }`}
                  >
                    <span>
                      <span className="block">{u.name}</span>
                      <span className="block text-xs text-ink-500">{u.email}</span>
                    </span>
                    <span className="text-xs text-ink-500">{u.organization || 'No organization'}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div>
            <label className="label-text">Permission</label>
            <select className="input-field" value={selectedPermission} onChange={(e) => setSelectedPermission(e.target.value)}>
              {PERMISSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={addCollaborator} className="btn-primary w-full">Add Collaborator</button>
        </div>
      </Modal>
    </div>
  );
}
