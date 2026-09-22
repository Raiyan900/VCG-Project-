import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit3, UploadCloud, Share2, Quote, Archive, ArrowLeft, ExternalLink } from 'lucide-react';
import { datasetService } from '../services';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import LifecycleTracker from '../components/LifecycleTracker';
import { formatBytes } from '../utils/format';
import Modal from '../components/Modal';

import OverviewTab from './dataset/OverviewTab';
import FilesTab from './dataset/FilesTab';
import MetadataTab from './dataset/MetadataTab';
import VersionsTab from './dataset/VersionsTab';
import ValidationTab from './dataset/ValidationTab';
import AccessTab from './dataset/AccessTab';
import CollaborationTab from './dataset/CollaborationTab';
import CitationsTab from './dataset/CitationsTab';

const TABS = ['Overview', 'Files', 'Metadata', 'Versions', 'Validation', 'Access', 'Activity', 'Citations'];

export default function DatasetDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const toast = useToast();

  function load() {
    datasetService.get(id)
      .then((data) => {
        const nextDataset = { ...data.dataset, access: data.access, duplicateRelationship: data.duplicateRelationship };
        setDataset(nextDataset);
        setError('');
        setEditForm({ name: data.dataset.name, description: data.dataset.description });
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (status === 403) {
          setError("You don't have permission to access this dataset.");
        } else if (status === 404) {
          setError('Dataset not found.');
        } else {
          setError('Unable to load this dataset.');
        }
        setDataset(null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  function updateDatasetState(updated) {
    setDataset((current) => ({
      ...current,
      ...updated,
      duplicateRelationship: updated.duplicateRelationship ?? current?.duplicateRelationship,
    }));
  }

  async function handleArchive() {
    try {
      const { dataset: updated, access } = await datasetService.archive(id);
      setDataset({ ...updated, access });
      toast.success('Dataset archived');
    } catch (err) {
      toast.error('Failed to archive dataset');
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      const { dataset: updated, access } = await datasetService.update(id, editForm);
      setDataset({ ...updated, access });
      setEditOpen(false);
      toast.success('Dataset updated');
    } catch (err) {
      toast.error('Failed to update dataset');
    }
  }

  if (loading) return <div className="card p-10 text-center text-sm text-ink-500">Loading dataset…</div>;
  if (!dataset) {
    return (
      <div className="card p-10 text-center text-sm text-ink-500">
        {error || 'Dataset not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
        <ArrowLeft size={15} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-ink-50 sm:text-2xl">{dataset.name}</h1>
              <StatusBadge status={dataset.status} />
              {dataset.duplicateRelationship && <StatusBadge status="Duplicated" />}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-ink-400">{dataset.description}</p>
            {dataset.duplicateRelationship?.originalDataset && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-accent-warn">
                <span>This dataset has been marked as a duplicate of {dataset.duplicateRelationship.originalDataset.name}.</span>
                <button onClick={() => navigate(`/app/datasets/${dataset.duplicateRelationship.originalDataset._id}`)} className="inline-flex items-center gap-1 text-accent-green hover:text-ink-100">
                  View Original Dataset <ExternalLink size={12} />
                </button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
              <span>Version {dataset.currentVersion}</span>
              <span>Owner: {dataset.owner?.name}</span>
              <span>{formatBytes(dataset.size)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {dataset.access?.canEdit && (
              <button onClick={() => setEditOpen(true)} className="btn-secondary"><Edit3 size={14} /> Edit</button>
            )}
            {dataset.access?.canUpload && (
              <button onClick={() => setTab('Versions')} className="btn-secondary"><UploadCloud size={14} /> Upload Version</button>
            )}
            {dataset.access?.canManageAccess && (
              <button onClick={() => setTab('Access')} className="btn-secondary"><Share2 size={14} /> Share</button>
            )}
            <button onClick={() => setTab('Citations')} className="btn-secondary"><Quote size={14} /> Cite</button>
            {dataset.access?.canArchive && dataset.status !== 'Archived' && dataset.status !== 'Retired' && (
              <button onClick={handleArchive} className="btn-secondary"><Archive size={14} /> Archive</button>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto pb-1">
          <LifecycleTracker lifecycle={dataset.lifecycle} />
        </div>
      </motion.div>

      <div className="card p-1.5">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t ? 'bg-surface-600/70 text-accent-green' : 'text-ink-400 hover:bg-surface-700/60 hover:text-ink-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === 'Overview' && <OverviewTab dataset={dataset} onUpdate={updateDatasetState} />}
        {tab === 'Files' && <FilesTab datasetId={dataset._id} />}
        {tab === 'Metadata' && <MetadataTab dataset={dataset} onUpdate={updateDatasetState} />}
        {tab === 'Versions' && <VersionsTab dataset={dataset} onUpdate={updateDatasetState} />}
        {tab === 'Validation' && <ValidationTab dataset={dataset} onUpdate={updateDatasetState} />}
        {tab === 'Access' && <AccessTab dataset={dataset} onUpdate={updateDatasetState} />}
        {tab === 'Activity' && <CollaborationTab dataset={dataset} />}
        {tab === 'Citations' && <CitationsTab dataset={dataset} />}
      </motion.div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Dataset">
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="label-text">Name</label>
            <input className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Description</label>
            <textarea className="input-field" rows={4} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
}
