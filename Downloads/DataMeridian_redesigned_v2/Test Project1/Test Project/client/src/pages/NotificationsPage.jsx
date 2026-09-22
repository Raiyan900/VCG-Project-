import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, ShieldCheck, Users2, GitBranch, Copy, FileWarning, Share2 } from 'lucide-react';
import { notificationService } from '../services';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../utils/format';
import EmptyState from '../components/EmptyState';

const ICONS = {
  validation: ShieldCheck,
  collaborator: Users2,
  version: GitBranch,
  duplicate: Copy,
  metadata: FileWarning,
  share: Share2,
  system: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  function load() {
    notificationService.list().then((data) => setNotifications(data.notifications)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function markAllRead() {
    await notificationService.markAllAsRead();
    toast.success('All notifications marked as read');
    load();
  }

  async function markRead(id) {
    await notificationService.markAsRead(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Notifications</h1>
          <p className="mt-1 text-sm text-ink-400">Stay updated on validation, sharing, and collaboration events.</p>
        </div>
        <button onClick={markAllRead} className="btn-secondary"><CheckCheck size={15} /> Mark all as read</button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-500">Loading notifications…</div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="card divide-y divide-surface-600/40 p-0">
          {notifications.map((n, i) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <motion.button
                key={n._id}
                onClick={() => markRead(n._id)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-700/30 ${!n.read ? 'bg-surface-800/40' : ''}`}
              >
                <div className={`mt-0.5 rounded-lg p-2 ${!n.read ? 'bg-accent-green/10 text-accent-green' : 'bg-surface-700/60 text-ink-400'}`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${!n.read ? 'font-medium text-ink-100' : 'text-ink-400'}`}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-green" />}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
