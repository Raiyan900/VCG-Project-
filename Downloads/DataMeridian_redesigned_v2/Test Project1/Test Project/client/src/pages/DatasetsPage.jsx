import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, List, Search } from 'lucide-react';
import DatasetCard from '../components/DatasetCard';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { SkeletonCard } from '../components/Skeleton';
import { datasetService } from '../services';
import { formatBytes, formatDate } from '../utils/format';

const STATUSES = ['Draft', 'Active', 'Validating', 'Archived', 'Retired'];

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    setLoading(true);
    datasetService
      .list({ search: search || undefined, status: status || undefined, sort })
      .then((data) => setDatasets(data.datasets))
      .finally(() => setLoading(false));
  }, [search, status, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Datasets</h1>
          <p className="mt-1 text-sm text-ink-400">Manage all datasets you own or collaborate on.</p>
        </div>
        <Link to="/app/upload" className="btn-primary">
          <Plus size={16} /> Upload Dataset
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            className="input-field pl-10"
            placeholder="Search by name, tag, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-field sm:w-44" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name (A-Z)</option>
          <option value="size">Largest First</option>
          <option value="updated">Recently Updated</option>
        </select>
        <div className="flex gap-1 rounded-lg border border-surface-600/60 p-1">
          <button onClick={() => setView('grid')} className={`rounded p-1.5 ${view === 'grid' ? 'bg-accent-green/15 text-accent-green' : 'text-ink-400'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('list')} className={`rounded p-1.5 ${view === 'list' ? 'bg-accent-green/15 text-accent-green' : 'text-ink-400'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState
          title="No datasets found"
          description="Try changing your filters or upload your first research dataset."
          action={<Link to="/app/upload" className="btn-primary"><Plus size={16} /> Upload Dataset</Link>}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {datasets.map((d, i) => <DatasetCard key={d._id} dataset={d} index={i} />)}
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600/50 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d._id} className="border-b border-surface-600/30 last:border-0 hover:bg-surface-700/30">
                  <td className="px-4 py-3">
                    <Link to={`/app/datasets/${d._id}`} className="font-medium text-ink-100 hover:text-accent-green">{d.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-ink-400">{d.owner?.name || '—'}</td>
                  <td className="px-4 py-3 text-ink-400">{d.type}</td>
                  <td className="px-4 py-3 text-ink-400">v{d.currentVersion}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-ink-400">{formatBytes(d.size)}</td>
                  <td className="px-4 py-3 text-ink-400">{formatDate(d.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
