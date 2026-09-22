import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArchiveX } from 'lucide-react';
import { datasetService } from '../services';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import { formatDate } from '../utils/format';

export default function RetiredPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetService.list({ status: 'Retired', sort: 'updated' }).then((data) => setDatasets(data.datasets)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Retired Datasets</h1>
        <p className="mt-1 text-sm text-ink-400">Datasets formally retired with retention information.</p>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        ) : datasets.length === 0 ? (
          <EmptyState icon={ArchiveX} title="No retired datasets" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600/50 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3 font-medium">Dataset</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Retired</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Previous Version</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d._id} className="border-b border-surface-600/30 last:border-0 hover:bg-surface-700/30">
                  <td className="px-4 py-3">
                    <Link to={`/app/datasets/${d._id}`} className="font-medium text-ink-100 hover:text-accent-green">{d.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-ink-400">{d.owner?.name || '—'}</td>
                  <td className="px-4 py-3 text-ink-400">{formatDate(d.retiredInfo?.retiredAt)}</td>
                  <td className="px-4 py-3 text-ink-400">{d.retiredInfo?.reason || '—'}</td>
                  <td className="px-4 py-3 text-ink-400">v{d.currentVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
