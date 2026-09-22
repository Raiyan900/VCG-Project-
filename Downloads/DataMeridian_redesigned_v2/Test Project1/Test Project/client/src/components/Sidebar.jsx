import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Database, Compass, UploadCloud, ShieldCheck, GitBranch, Archive,
  ArchiveX, Users2, BarChart3, HardDrive, Copy, Sparkles, Settings, Dna, X,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    items: [
      { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/app/datasets', label: 'Datasets', icon: Database },
      { to: '/app/discover', label: 'Discover', icon: Compass },
      { to: '/app/upload', label: 'Upload Dataset', icon: UploadCloud },
    ],
  },
  {
    title: 'Data Lifecycle',
    items: [
      { to: '/app/validation', label: 'Validation', icon: ShieldCheck },
      { to: '/app/versions', label: 'Versions', icon: GitBranch },
      { to: '/app/archive', label: 'Archive', icon: Archive },
      { to: '/app/retired', label: 'Retired', icon: ArchiveX },
    ],
  },
  {
    title: 'Collaboration',
    items: [
      { to: '/app/shared', label: 'Shared With Me', icon: Users2 },
      { to: '/app/team', label: 'Team', icon: Users2 },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { to: '/app/storage', label: 'Storage', icon: HardDrive },
      { to: '/app/duplicates', label: 'Duplicates', icon: Copy },
    ],
  },
  {
    items: [
      { to: '/app/ai-tools', label: 'AI Tools', icon: Sparkles },
      { to: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-surface-950/80 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : undefined }}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-brand-deep bg-brand-sidebar transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(8,203,0,0.3)', '0 0 0 6px rgba(8,203,0,0)'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green/15 text-accent-green"
            >
              <Dna size={18} />
            </motion.div>
            <span className="text-sm font-bold tracking-tight text-ink-50">DataMeridian</span>
          </div>
          <button className="text-ink-400 hover:text-ink-100 lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-500">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive ? 'bg-surface-600/70 text-accent-green' : 'text-ink-300 hover:translate-x-0.5 hover:bg-accent-green/[0.06] hover:text-ink-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="active-nav"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent-green"
                          />
                        )}
                        <item.icon size={17} className="transition-transform duration-200 group-hover:scale-110" />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
}
