import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { datasetService } from '../services';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { formatDate } from '../utils/format';

export default function VersionsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetService.list({ sort: 'updated' }).then((data) => setDatasets(data.datasets)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Versions</h1>
        <p className="mt-1 text-sm text-ink-400">Track version history across all datasets.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState icon={GitBranch} title="No dataset versions found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((d) => (
            <Link key={d._id} to={`/app/datasets/${d._id}`} className="card card-hover p-5">
              <div className="flex items-center gap-2">
                <GitBranch size={16} className="text-accent-green" />
                <span className="text-sm font-semibold text-ink-50">v{d.currentVersion}</span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm font-medium text-ink-100">{d.name}</p>
              <p className="mt-1 text-xs text-ink-500">Updated {formatDate(d.updatedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
