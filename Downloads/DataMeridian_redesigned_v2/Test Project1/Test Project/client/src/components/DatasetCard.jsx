import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, Clock, HardDrive } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatBytes, timeAgo, DOMAIN_COLORS } from '../utils/format';

export default function DatasetCard({ dataset, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/app/datasets/${dataset._id}`} className="card card-hover group block h-full p-5">
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            style={{ backgroundColor: `${DOMAIN_COLORS[dataset.domain] || '#8E8E8E'}22`, color: DOMAIN_COLORS[dataset.domain] || '#8E8E8E' }}
          >
            <Database size={18} />
          </div>
          <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
            <StatusBadge status={dataset.status} />
            {dataset.isDuplicate && <StatusBadge status="Duplicated" />}
          </div>
        </div>
        <h3 className="mt-3.5 line-clamp-1 text-sm font-semibold text-ink-50">{dataset.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-xs text-ink-400">{dataset.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {(dataset.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-surface-700/60 px-2 py-0.5 text-[10px] text-ink-300">{tag}</span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-surface-600/40 pt-3 text-xs text-ink-500">
          <span className="flex items-center gap-1"><HardDrive size={12} /> {formatBytes(dataset.size)}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(dataset.updatedAt)}</span>
        </div>
      </Link>
    </motion.div>
  );
}
