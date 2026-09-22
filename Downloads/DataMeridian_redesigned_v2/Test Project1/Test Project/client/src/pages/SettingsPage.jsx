import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Bell, Palette, Database, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import { useToast } from '../context/ToastContext';

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'account', label: 'Account', icon: Shield },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'data', label: 'Data Preferences', icon: Database },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [active, setActive] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', organization: user?.organization || '' });
  const [notifPrefs, setNotifPrefs] = useState({ validation: true, collaborator: true, version: true, duplicate: false });
  const toast = useToast();

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const { user: updated } = await userService.updateMe(form);
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Settings</h1>
        <p className="mt-1 text-sm text-ink-400">Manage your account and platform preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="space-y-1 lg:col-span-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active === s.key ? 'bg-surface-600/70 text-accent-green' : 'text-ink-300 hover:bg-surface-700/60'
              }`}
            >
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </div>

        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6 lg:col-span-3">
          {active === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-50">Profile Information</h3>
              <div>
                <label className="label-text">Full Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Organization</label>
                <input className="input-field" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary"><Save size={15} /> Save Changes</button>
            </form>
          )}

          {active === 'account' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-50">Account Details</h3>
              <div>
                <label className="label-text">Email</label>
                <input className="input-field" value={user?.email} disabled />
              </div>
              <p className="text-xs text-ink-500">Email changes are not supported in this demo environment.</p>
            </div>
          )}

          {active === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-50">Password & Security</h3>
              <div>
                <label className="label-text">Current Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="label-text">New Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <button className="btn-primary">Update Password</button>
            </div>
          )}

          {active === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-50">Notification Preferences</h3>
              {Object.entries(notifPrefs).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between rounded-lg border border-surface-600/60 px-4 py-3">
                  <span className="text-sm capitalize text-ink-200">{key} notifications</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, [key]: e.target.checked })}
                    className="h-4 w-4 accent-accent-green"
                  />
                </label>
              ))}
            </div>
          )}

          {active === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-50">Appearance</h3>
              <p className="text-sm text-ink-400">DataMeridian uses a sophisticated dark theme optimized for scientific data review. Light mode is not currently available.</p>
            </div>
          )}

          {active === 'data' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-50">Data Preferences</h3>
              <label className="flex items-center justify-between rounded-lg border border-surface-600/60 px-4 py-3">
                <span className="text-sm text-ink-200">Enable AI-powered suggestions</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-accent-green" />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-surface-600/60 px-4 py-3">
                <span className="text-sm text-ink-200">Auto-run validation on new versions</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-accent-green" />
              </label>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
