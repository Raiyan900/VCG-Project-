import { STATUS_COLORS } from '../utils/format';

export default function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || STATUS_COLORS.Draft;
  return <span className={`badge border ${cls}`}>{status}</span>;
}
