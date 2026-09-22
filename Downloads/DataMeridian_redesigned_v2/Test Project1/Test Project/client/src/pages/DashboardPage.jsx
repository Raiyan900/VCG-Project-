import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Activity, Archive, Copy, HardDrive } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import StatCard from '../components/StatCard';
import { SkeletonCard } from '../components/Skeleton';
import { analyticsService, datasetService, ANALYTICS_REFRESH_EVENT } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatBytes, formatDate, DOMAIN_COLORS, CHART_TOOLTIP, CHART_GRID_STROKE } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';

const LIFECYCLE_COLORS = { Active: '#08CB00', Archived: '#2E8B14', Validating: '#8E8E8E', Retired: '#4B5A33' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [analytics, datasets] = await Promise.all([analyticsService.dashboard(), datasetService.list({ sort: 'newest' })]);
      setData(analytics);
      setRecent(datasets.datasets.slice(0, 6));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard analytics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    window.addEventListener(ANALYTICS_REFRESH_EVENT, load);
    return () => {
      clearInterval(interval);
      window.removeEventListener(ANALYTICS_REFRESH_EVENT, load);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!data && error) {
    return (
      <div className="card p-10 text-center text-sm text-accent-danger">
        <p>{error}</p>
        <button onClick={load} className="btn-secondary mt-4">Retry</button>
      </div>
    );
  }

  if (!data) return <div className="card p-10 text-center text-sm text-ink-500">Loading dashboard analytics…</div>;

  const growthData = data.growth || [];
  const categoryData = data.byDomain.map((d) => ({ name: d._id || 'Other', value: d.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-ink-400">Here&apos;s what&apos;s happening with your research data today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Database} label="Total Datasets" value={data.stats.totalDatasets.toLocaleString()} accent="teal" delay={0} />
        <StatCard icon={Activity} label="Active" value={data.stats.activeDatasets.toLocaleString()} accent="cyan" delay={0.05} />
        <StatCard icon={Archive} label="Archived" value={data.stats.archivedDatasets.toLocaleString()} accent="violet" delay={0.1} />
        <StatCard icon={Copy} label="Duplicates Detected" value={data.stats.duplicatesDetected.toLocaleString()} accent="rose" delay={0.15} />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(data.stats.storageBytes)} accent="amber" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink-50">Dataset Growth</h3>
          <div className="mt-4 h-64">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#08CB00" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#08CB00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" stroke="#8E8E8E" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8E8E8E" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Area type="monotone" dataKey="count" stroke="#08CB00" strokeWidth={2} fill="url(#growthFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-xs text-ink-500">No historical data yet.</div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <h3 className="text-sm font-semibold text-ink-50">Dataset Lifecycle</h3>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.lifecycleDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="#0C100A">
                  {data.lifecycleDistribution.map((entry) => <Cell key={entry.name} fill={LIFECYCLE_COLORS[entry.name] || '#8E8E8E'} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span style={{ color: '#C8C8C8' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink-50">Recent Datasets</h3>
          <div className="mt-3 divide-y divide-surface-600/40">
            {recent.map((d) => (
              <Link key={d._id} to={`/app/datasets/${d._id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-surface-700/30 -mx-2 px-2 rounded-lg transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-100">{d.name}</p>
                  <p className="text-xs text-ink-500">{d.domain} • {formatDate(d.createdAt)}</p>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
            {recent.length === 0 && <p className="py-6 text-center text-sm text-ink-500">No datasets yet</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <h3 className="text-sm font-semibold text-ink-50">Dataset Categories</h3>
          <div className="mt-2 h-56">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
                  <XAxis type="number" stroke="#8E8E8E" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#8E8E8E" fontSize={11} tickLine={false} axisLine={false} width={90} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry) => <Cell key={entry.name} fill={DOMAIN_COLORS[entry.name] || '#8E8E8E'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-xs text-ink-500">No dataset category data yet.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
