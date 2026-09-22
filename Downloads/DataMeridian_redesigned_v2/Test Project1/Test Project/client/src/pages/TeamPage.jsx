import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { userService } from '../services';
import { SkeletonCard } from '../components/Skeleton';

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.list().then((data) => setUsers(data.users)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Team</h1>
        <p className="mt-1 text-sm text-ink-400">Researchers and collaborators on DataMeridian.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u, i) => (
            <motion.div key={u._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-green/15 text-base font-semibold text-accent-green">
                  {u.name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-100">{u.name}</p>
                  <p className="truncate text-xs text-ink-500">{u.organization}</p>
                </div>
              </div>
              <p className="mt-3 truncate text-xs text-ink-400">{u.email}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
