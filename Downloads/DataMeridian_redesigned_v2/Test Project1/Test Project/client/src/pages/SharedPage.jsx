import { useEffect, useState } from 'react';
import { Users2 } from 'lucide-react';
import DatasetCard from '../components/DatasetCard';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { datasetService } from '../services';
import { useAuth } from '../context/AuthContext';

export default function SharedPage() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetService.list({ sort: 'updated' }).then((data) => {
      // Datasets not owned by current user represent items shared with them (demo semantics)
      const shared = data.datasets.filter((d) => d.owner?._id !== user?.id && d.visibility !== 'Private');
      setDatasets(shared);
    }).finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Shared With Me</h1>
        <p className="mt-1 text-sm text-ink-400">Datasets other researchers have shared with you.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState icon={Users2} title="Nothing shared yet" description="Datasets shared with you by collaborators will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((d, i) => <DatasetCard key={d._id} dataset={d} index={i} />)}
        </div>
      )}
    </div>
  );
}
