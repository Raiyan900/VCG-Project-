import { useEffect, useRef, useState } from 'react';
import { HardDrive, Database, Archive, ArchiveX, FolderOpen, Layers, TrendingUp, FileStack } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import { analyticsService, ANALYTICS_REFRESH_EVENT } from '../services';
import { DOMAIN_COLORS, formatBytes, CHART_TOOLTIP, CHART_GRID_STROKE } from '../utils/format';

const POLL_INTERVAL_MS = 30000;

export default function StoragePage() {
  const [data, setData] = useState(null);
  const [userStorage, setUserStorage] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState(null);
  const [fetching, setFetching] = useState(false);
  const pollRef = useRef(null);

  async function load() {
    setFetching(true);
    try {
      const [result, usersResult] = await Promise.all([
        analyticsService.storage(),
        analyticsService.storageUsers(),
      ]);
      setData(result);
      setUserStorage(usersResult.users || []);
      setLastSuccessfulUpdate(new Date());
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load storage analytics');
    } finally {
      setFetching(false);
    }
  }

  async function showUserStorage(userId) {
    try {
      const result = await analyticsService.storageUser(userId);
      setSelectedUser(result.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load user storage details');
    }
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, POLL_INTERVAL_MS);
    window.addEventListener(ANALYTICS_REFRESH_EVENT, load);
    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener(ANALYTICS_REFRESH_EVENT, load);
    };
  }, []);

  if (!data && fetching) return <div className="card p-10 text-center text-sm text-ink-500">Loading storage analytics…</div>;
  if (!data && error) {
    return (
      <div className="card p-10 text-center text-sm text-accent-danger">
        <p>{error}</p>
        <button onClick={load} className="btn-secondary mt-4">Retry</button>
      </div>
    );
  }
  if (!data) return <div className="card p-10 text-center text-sm text-ink-500">Loading storage analytics…</div>;

  const historyData = (data.history || []).map((h) => ({
    label: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalBytes: h.totalBytes,
    activeBytes: h.activeBytes,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Storage Analytics</h1>
          <p className="mt-1 text-sm text-ink-400">Live storage usage calculated from real dataset and file data.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <span className={`flex items-center gap-1.5 ${error ? 'text-accent-danger' : 'text-accent-green'}`}>
            <span className={`h-2 w-2 rounded-full ${error ? 'bg-accent-danger' : 'animate-pulse bg-accent-green'}`} /> {error ? 'Connection issue' : 'Live'}
          </span>
          {lastSuccessfulUpdate && <span>{error ? 'Last successful update' : 'Last updated'}: {lastSuccessfulUpdate.toLocaleTimeString()}</span>}
          {fetching && <span>Refreshing…</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={HardDrive} label="Total Storage" value={formatBytes(data.totalBytes)} accent="teal" />
        <StatCard icon={Database} label="Active Storage" value={formatBytes(data.activeBytes)} accent="cyan" delay={0.05} />
        <StatCard icon={Archive} label="Archived Storage" value={formatBytes(data.archivedBytes)} accent="violet" delay={0.1} />
        <StatCard icon={ArchiveX} label="Retired Storage" value={formatBytes(data.retiredBytes)} accent="rose" delay={0.15} />
        <StatCard icon={FolderOpen} label="Available Storage" value={data.availableBytes === null ? 'Not configured' : formatBytes(data.availableBytes)} accent="amber" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileStack} label="Number of Files" value={data.fileCount.toLocaleString()} accent="cyan" />
        <StatCard icon={Layers} label="Number of Datasets" value={data.datasetCount.toLocaleString()} accent="teal" delay={0.05} />
        <StatCard icon={TrendingUp} label="Average Dataset Size" value={formatBytes(data.averageDatasetSizeBytes)} accent="violet" delay={0.1} />
        <StatCard icon={Database} label="Version Storage" value={formatBytes(data.versionStorageBytes)} accent="amber" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-50">Storage Growth</h3>
          <div className="mt-4 h-64">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#08CB00" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#08CB00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" stroke="#8E8E8E" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatBytes} stroke="#8E8E8E" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(value) => formatBytes(Number(value))} />
                  <Area type="monotone" dataKey="totalBytes" stroke="#08CB00" strokeWidth={2} fill="url(#storageFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-xs text-ink-500">
                {historyData.length === 1 ? 'One historical point is available; more history is needed for a trend.' : 'No historical data yet.'}
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-50">Storage by Dataset Type</h3>
          <div className="mt-4 h-64">
            {data.byType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byType} dataKey="storageBytes" nameKey="type" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="#0C100A">
                    {data.byType.map((entry) => (
                      <Cell key={entry.type} fill={DOMAIN_COLORS[entry.type] || '#8E8E8E'} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} formatter={(value) => formatBytes(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-ink-500">No dataset storage recorded yet.</div>
            )}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink-50">Storage by Organization</h3>
          <div className="mt-4 h-64">
            {data.byOrganization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byOrganization}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis dataKey="org" stroke="#8E8E8E" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatBytes} stroke="#8E8E8E" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(value) => formatBytes(Number(value))} />
                  <Bar dataKey="storageBytes" fill="#08CB00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-ink-500">No organization storage recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-ink-50">Storage by User</h3>
            <p className="mt-1 text-xs text-ink-500">Physical files are attributed to dataset owners, never collaborators.</p>
          </div>
          <span className="text-xs text-ink-500">{userStorage.length} user{userStorage.length === 1 ? '' : 's'}</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-surface-600/60 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-3 py-3 font-medium">User</th>
                <th className="px-3 py-3 font-medium">Datasets</th>
                <th className="px-3 py-3 font-medium">Files</th>
                <th className="px-3 py-3 font-medium">Storage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/60">
              {userStorage.map((entry) => (
                <tr key={entry.userId} className="text-ink-200">
                  <td className="px-3 py-3">
                    <button onClick={() => showUserStorage(entry.userId)} className="text-left hover:text-accent-green">
                      <span className="block font-medium">{entry.username}</span>
                      <span className="block text-xs text-ink-500">{entry.email}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3">{entry.datasetCount}</td>
                  <td className="px-3 py-3">{entry.fileCount}</td>
                  <td className="px-3 py-3 font-medium text-accent-green">{formatBytes(entry.storageBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-50">{selectedUser.username}&apos;s Owned Datasets</h3>
              <p className="mt-1 text-xs text-ink-500">Total storage: {formatBytes(selectedUser.storageBytes)}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="btn-ghost text-ink-400">Close</button>
          </div>
          <div className="mt-4 space-y-2">
            {selectedUser.datasets.length === 0 ? (
              <p className="text-sm text-ink-500">No owned datasets.</p>
            ) : (
              selectedUser.datasets.map((dataset) => (
                <div key={dataset.datasetId} className="flex items-center justify-between rounded-lg border border-surface-600/60 bg-surface-800/30 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-100">{dataset.name}</p>
                    <p className="text-xs text-ink-500">{dataset.fileCount} file{dataset.fileCount === 1 ? '' : 's'}</p>
                  </div>
                  <span className="text-sm font-medium text-accent-green">{formatBytes(dataset.storageBytes)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
