import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Search, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services';
import CommandPalette from './CommandPalette';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    notificationService.list().then((data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-brand-deep bg-brand-navbar/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <button onClick={onMenuClick} className="text-ink-300 hover:text-ink-50 lg:hidden">
          <Menu size={20} />
        </button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setPaletteOpen(true)}
          className="flex flex-1 max-w-md items-center gap-2.5 rounded-lg border border-surface-600/60 bg-surface-800/60 px-3.5 py-2 text-sm text-ink-400 transition-colors hover:border-accent-green/40"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search datasets, people, tags…</span>
          <kbd className="rounded border border-surface-500 bg-surface-700 px-1.5 py-0.5 text-[10px] text-ink-400">Ctrl K</kbd>
        </motion.button>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative rounded-lg p-2 text-ink-300 hover:bg-surface-700/60 hover:text-ink-50"
            >
              <motion.span
                animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block"
              >
                <Bell size={19} />
              </motion.span>
              {unreadCount > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent-danger"
                />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 card p-2 shadow-xl">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm font-semibold text-ink-50">Notifications</span>
                  <button
                    onClick={() => navigate('/app/notifications')}
                    className="text-xs text-accent-green hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="px-2 py-4 text-center text-sm text-ink-500">No notifications yet</p>
                  )}
                  {notifications.slice(0, 6).map((n) => (
                    <div key={n._id} className="rounded-lg px-2 py-2 text-sm hover:bg-surface-700/50">
                      <p className={n.read ? 'text-ink-400' : 'text-ink-100'}>{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-700/60"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-green/20 text-sm font-semibold text-accent-green">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="hidden text-sm font-medium text-ink-100 sm:inline">{user?.name}</span>
              <ChevronDown size={14} className="hidden text-ink-400 sm:inline" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 card p-1.5 shadow-xl">
                <button
                  onClick={() => { setProfileOpen(false); navigate('/app/profile'); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-surface-700/60"
                >
                  <User size={15} /> Profile
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/app/settings'); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-surface-700/60"
                >
                  <Settings size={15} /> Settings
                </button>
                <div className="my-1 h-px bg-surface-600/60" />
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-accent-danger hover:bg-surface-700/60"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
