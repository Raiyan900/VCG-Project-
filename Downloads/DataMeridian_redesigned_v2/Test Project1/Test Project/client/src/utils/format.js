export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  const precision = i === 0 ? 0 : 2;
  const formatted = value.toFixed(precision).replace(/\.0+$|(?<=\.[0-9]*?)0+$/, '');
  return `${formatted} ${units[i]}`;
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export const STATUS_COLORS = {
  Draft: 'bg-ink-500/15 text-ink-300 border-ink-500/30',
  Active: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  Validating: 'bg-accent-warn/15 text-accent-warn border-accent-warn/30',
  Duplicated: 'bg-accent-warn/15 text-accent-warn border-accent-warn/30',
  Archived: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  Retired: 'bg-accent-danger/15 text-accent-danger border-accent-danger/30',
};

// Green/grey chart palette. Must stay 6-digit hex (DatasetCard appends alpha).
export const DOMAIN_COLORS = {
  Genomics: '#08CB00',
  Proteomics: '#EEEEEE',
  Imaging: '#2E8B14',
  Clinical: '#8E8E8E',
  Transcriptomics: '#556B2F',
  Other: '#666666',
};

// Shared recharts styling (visual only)
export const CHART_GRID_STROKE = 'rgba(8,203,0,0.10)';
export const CHART_TOOLTIP = {
  contentStyle: { background: '#0C100A', border: '1px solid #253900', borderRadius: 8, fontSize: 12 },
  itemStyle: { color: '#EEEEEE' },
  labelStyle: { color: '#C8C8C8' },
  cursor: { stroke: '#08CB00', strokeOpacity: 0.35, fill: 'rgba(8,203,0,0.06)' },
};
