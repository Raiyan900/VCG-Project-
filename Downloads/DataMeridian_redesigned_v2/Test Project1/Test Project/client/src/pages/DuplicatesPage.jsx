import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ScanSearch, Check, EyeOff, Fingerprint, ExternalLink, Trash2 } from 'lucide-react';
import { duplicateService } from '../services';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const CATEGORY_STYLES = {
  'Exact Duplicate': 'border-accent-danger/30 bg-accent-danger/10 text-accent-danger',
  'Likely Duplicate': 'border-accent-warn/30 bg-accent-warn/10 text-accent-warn',
  'Related Dataset': 'border-accent-green/30 bg-accent-green/10 text-accent-green',
};

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [action, setAction] = useState(null);
  const toast = useToast();

  function load() {
    duplicateService.list().then((data) => setDuplicates(data.duplicates)).catch(() => toast.error('Failed to load duplicate analysis')).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function scan() {
    setScanning(true);
    try {
      const result = await duplicateService.scan();
      toast.success(result.message);
      load();
    } catch (err) {
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  }

  function openConfirm(pair) {
    setAction({ type: 'confirm', pair, originalId: String(pair.datasetA?._id) });
  }

  function openRemove(pair) {
    setAction({ type: 'remove', pair });
  }

  async function resolve() {
    const { pair, type, originalId } = action;
    const duplicateId = type === 'confirm'
      ? String(pair.datasetA?._id) === originalId ? pair.datasetB?._id : pair.datasetA?._id
      : null;
    try {
      await duplicateService.resolve(
        pair._id,
        type === 'confirm' ? 'Confirmed' : 'Ignored',
        type === 'confirm' ? { originalDataset: originalId, duplicateDataset: duplicateId } : undefined
      );
      setAction(null);
      toast.success(type === 'confirm' ? 'Duplicate relationship confirmed' : 'Duplicate status removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update duplicate');
    }
  }

  const unresolvedCount = duplicates.filter((d) => d.status === 'Unresolved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Duplicate Detection</h1>
          <p className="mt-1 text-sm text-ink-400">{unresolvedCount} Potential Duplicate{unresolvedCount !== 1 ? 's' : ''} Detected</p>
        </div>
        <button onClick={scan} disabled={scanning} className="btn-primary">
          <ScanSearch size={16} /> {scanning ? 'Scanning…' : 'Run Duplicate Scan'}
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-500">Loading duplicate analysis…</div>
      ) : duplicates.length === 0 ? (
        <EmptyState icon={Copy} title="No duplicates detected" description="Run an AI scan to check for similar datasets." />
      ) : (
        <div className="space-y-4">
          {duplicates.map((d, i) => (
            <motion.div key={d._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-500">Dataset A</p>
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-ink-100">{d.datasetA?.name}</p>
                      {d.datasetA?._id && <a href={`/app/datasets/${d.datasetA._id}`} className="shrink-0 text-ink-500 hover:text-accent-green" title="View dataset"><ExternalLink size={13} /></a>}
                    </div>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="text-lg font-bold text-accent-warn">{d.similarity}%</span>
                    <span className="text-[10px] text-ink-500">Similarity</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-500">Dataset B</p>
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-ink-100">{d.datasetB?.name}</p>
                      {d.datasetB?._id && <a href={`/app/datasets/${d.datasetB._id}`} className="shrink-0 text-ink-500 hover:text-accent-green" title="View dataset"><ExternalLink size={13} /></a>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`badge border ${CATEGORY_STYLES[d.category] || CATEGORY_STYLES['Related Dataset']}`}>
                    {d.matchedByHash && <Fingerprint size={12} />} {d.category || 'Related Dataset'}
                  </span>
                  <span className={`badge border ${d.status === 'Confirmed' ? 'border-accent-danger/30 bg-accent-danger/10 text-accent-danger' : d.status === 'Ignored' ? 'border-ink-500/30 bg-ink-500/10 text-ink-400' : 'border-surface-500/40 bg-surface-700/40 text-ink-300'}`}>
                    {d.status === 'Unresolved' ? 'Potential Duplicate' : d.status === 'Confirmed' ? 'Confirmed Duplicate' : 'Ignored'}
                  </span>
                  {d.status === 'Unresolved' && (
                    <>
                      <button onClick={() => openConfirm(d)} className="btn-secondary text-xs"><Check size={13} /> Mark as Duplicate</button>
                      <button onClick={() => duplicateService.resolve(d._id, 'Ignored').then(() => { toast.success('Potential duplicate ignored'); load(); }).catch((err) => toast.error(err.response?.data?.message || 'Failed to ignore duplicate'))} className="btn-secondary text-xs"><EyeOff size={13} /> Ignore</button>
                    </>
                  )}
                  {d.status === 'Confirmed' && d.duplicateDataset?._id && (
                    <button onClick={() => openRemove(d)} className="btn-secondary text-xs"><Trash2 size={13} /> Remove Duplicate Status</button>
                  )}
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-600">
                <div className="h-full rounded-full bg-accent-warn" style={{ width: `${d.similarity}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={action?.type === 'remove' ? 'Remove Duplicate Status' : 'Mark this dataset as a duplicate?'}
      >
        {action?.type === 'confirm' ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-400">Select the original dataset that this dataset duplicates.</p>
            <div>
              <label className="label-text">Original Dataset</label>
              <select className="input-field" value={action.originalId} onChange={(e) => setAction({ ...action, originalId: e.target.value })}>
                <option value={action.pair.datasetA?._id}>{action.pair.datasetA?.name}</option>
                <option value={action.pair.datasetB?._id}>{action.pair.datasetB?.name}</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAction(null)} className="btn-secondary">Cancel</button>
              <button onClick={resolve} className="btn-primary">Confirm Duplicate</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-400">Remove the confirmed duplicate relationship from {action?.pair.duplicateDataset?.name || 'this dataset'}?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAction(null)} className="btn-secondary">Cancel</button>
              <button onClick={resolve} className="btn-primary">Remove Duplicate Status</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
