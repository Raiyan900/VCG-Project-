import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { datasetService } from '../services';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';

const STATUS_ICON = { Passed: CheckCircle2, Warning: AlertTriangle, Failed: XCircle, Pending: Clock };
const STATUS_COLOR = { Passed: 'text-accent-green', Warning: 'text-accent-warn', Failed: 'text-accent-danger', Pending: 'text-ink-400' };

export default function ValidationPage() {
  const [datasets, setDatasets] = useState([]);
  const [validations, setValidations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetService.list({ sort: 'updated' }).then(async (data) => {
      setDatasets(data.datasets);
      const entries = await Promise.all(
        data.datasets.slice(0, 30).map((d) => datasetService.latestValidation(d._id).then((v) => [d._id, v.validation]))
      );
      setValidations(Object.fromEntries(entries));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Validation</h1>
        <p className="mt-1 text-sm text-ink-400">Review data integrity and metadata validation status across datasets.</p>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : datasets.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No datasets to validate" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600/50 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3 font-medium">Dataset</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Domain</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => {
                const v = validations[d._id];
                const status = v?.status || 'Pending';
                const Icon = STATUS_ICON[status];
                return (
                  <tr key={d._id} className="border-b border-surface-600/30 last:border-0 hover:bg-surface-700/30">
                    <td className="px-4 py-3">
                      <Link to={`/app/datasets/${d._id}`} className="font-medium text-ink-100 hover:text-accent-green">{d.name}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 ${STATUS_COLOR[status]}`}>
                        <Icon size={15} /> {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-400">{v?.score ?? '—'}%</td>
                    <td className="px-4 py-3 text-ink-400">{d.domain}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
