import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Database, User as UserIcon } from 'lucide-react';
import { searchService } from '../services';

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ datasets: [], users: [] });
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!query) {
      setResults({ datasets: [], users: [] });
      return;
    }
    const timer = setTimeout(() => {
      searchService.global(query).then(setResults).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-surface-950/75 p-4 pt-24 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="card w-full max-w-xl overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-surface-600/60 px-4 py-3.5">
              <Search size={18} className="text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search datasets, users, tags…"
                className="flex-1 bg-transparent text-sm text-ink-50 placeholder:text-ink-500 focus:outline-none"
              />
              <kbd className="rounded border border-surface-500 px-1.5 py-0.5 text-[10px] text-ink-500">Esc</kbd>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {query && results.datasets.length === 0 && results.users.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink-500">No results found</p>
              )}
              {results.datasets.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">Datasets</p>
                  {results.datasets.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => { navigate(`/app/datasets/${d._id}`); onClose(); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-surface-700/60"
                    >
                      <Database size={15} className="text-accent-green" />
                      <span className="flex-1">{d.name}</span>
                      <span className="text-xs text-ink-500">{d.domain}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.users.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">People</p>
                  {results.users.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-200">
                      <UserIcon size={15} className="text-accent-green" />
                      <span className="flex-1">{u.name}</span>
                      <span className="text-xs text-ink-500">{u.organization}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
