import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { GitBranch, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { datasetService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { formatBytes, formatDateTime } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function VersionsTab({ dataset, onUpdate }) {
  const canUpload = Boolean(dataset.access?.canUpload);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  function load() {
    datasetService.listVersions(dataset._id).then((data) => setVersions(data.versions)).finally(() => setLoading(false));
  }

  useEffect(load, [dataset._id]);

  async function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('changes', 'New version uploaded');
      const { dataset: updated, access } = await datasetService.uploadVersion(dataset._id, formData);
      onUpdate({ ...updated, access });
      load();
      toast.success('New version uploaded');
    } catch (err) {
      toast.error('Failed to upload new version');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {canUpload && (
          <label className="btn-primary cursor-pointer">
            <UploadCloud size={15} /> {uploading ? 'Uploading…' : 'Upload New Version'}
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
        )}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-ink-500">Loading versions…</div>
      ) : versions.length === 0 ? (
        <EmptyState icon={GitBranch} title="No versions yet" description="Upload the first version of this dataset." />
      ) : (
        <div className="relative space-y-0 pl-6">
          <div className="absolute bottom-2 left-[9px] top-2 w-0.5 bg-surface-600/60" />
          {versions.map((v, i) => (
            <motion.div key={v._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative pb-5">
              <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 ${i === 0 ? 'border-accent-green bg-accent-green' : 'border-surface-500 bg-surface-800'}`} />
              <div className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink-50">Version {v.version}</span>
                  {i === 0 && <span className="badge border border-accent-green/30 bg-accent-green/10 text-accent-green">Current</span>}
                  <StatusBadge status={v.validationStatus === 'Passed' ? 'Active' : v.validationStatus === 'Failed' ? 'Retired' : 'Validating'} />
                </div>
                <p className="mt-1.5 text-sm text-ink-400">{v.changes}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span>By {v.createdBy?.name || 'Unknown'}</span>
                  <span>{formatDateTime(v.createdAt)}</span>
                  <span>{formatBytes(v.size)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
