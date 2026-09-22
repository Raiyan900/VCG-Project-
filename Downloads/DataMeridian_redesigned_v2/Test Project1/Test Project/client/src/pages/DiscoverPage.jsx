import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import DatasetCard from '../components/DatasetCard';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { datasetService } from '../services';

const DOMAINS = ['Genomics', 'Proteomics', 'Imaging', 'Clinical', 'Transcriptomics', 'Other'];
const VISIBILITIES = ['Public', 'Organization', 'Private', 'Restricted'];

export default function DiscoverPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [visibility, setVisibility] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      datasetService
        .list({ search: search || undefined, domain: domain || undefined, visibility: visibility || undefined })
        .then((data) => setDatasets(data.datasets))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search, domain, visibility]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Discover Datasets</h1>
        <p className="mt-1 text-sm text-ink-400">Search across the entire DataMeridian catalog.</p>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              className="input-field pl-10"
              placeholder="Search by dataset name, author, organization, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className="btn-secondary">
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-surface-600/40 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <select className="input-field" value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">All Domains</option>
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="input-field" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="">All Visibility</option>
              {VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        )}
      </div>

      <p className="text-sm text-ink-400">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState title="No datasets found" description="Try adjusting your search terms or filters." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {datasets.map((d, i) => <DatasetCard key={d._id} dataset={d} index={i} />)}
        </div>
      )}
    </div>
  );
}
