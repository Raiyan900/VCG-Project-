import { FolderSearch } from 'lucide-react';

export default function EmptyState({ icon: Icon = FolderSearch, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-surface-500/50 bg-surface-800/40 px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-surface-700/60 p-4 text-ink-400">
        <Icon size={28} />
      </div>
      <h3 className="text-lg font-semibold text-ink-50">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
