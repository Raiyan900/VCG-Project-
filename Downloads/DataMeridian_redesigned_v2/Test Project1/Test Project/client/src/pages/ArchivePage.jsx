import { useEffect, useState } from 'react';
import { Archive, RotateCcw, ArchiveX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { datasetService } from '../services';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { formatBytes, formatDate } from '../utils/format';

export default function ArchivePage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  function load() {
    datasetService.list({ status: 'Archived', sort: 'updated' }).then((data) => setDatasets(data.datasets)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleRestore(id) {
    try {
      await datasetService.restore(id);
      toast.success('Dataset restored to Active');
      load();
    } catch (err) {
      toast.error('Failed to restore dataset');
    }
  }

  async function handleRetire(id) {
    try {
      await datasetService.retire(id, 'Retired from archive');
      toast.success('Dataset retired');
      load();
    } catch (err) {
      toast.error('Failed to retire dataset');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Archive</h1>
        <p className="mt-1 text-sm text-ink-400">{datasets.length} Archived Datasets</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState icon={Archive} title="No archived datasets" description="Datasets you archive will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((d, i) => (
            <motion.div key={d._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <Link to={`/app/datasets/${d._id}`} className="line-clamp-1 text-sm font-semibold text-ink-50 hover:text-accent-green">{d.name}</Link>
              <p className="mt-1 text-xs text-ink-500">{formatBytes(d.size)} • Archived {formatDate(d.updatedAt)}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleRestore(d._id)} className="btn-secondary flex-1 text-xs"><RotateCcw size={13} /> Restore</button>
                <button onClick={() => handleRetire(d._id)} className="btn-secondary flex-1 text-xs"><ArchiveX size={13} /> Retire</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
