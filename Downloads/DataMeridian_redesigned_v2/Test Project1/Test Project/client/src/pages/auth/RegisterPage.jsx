import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, UserPlus } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', organization: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function validate() {
    const errs = {};
    if (!form.name) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join DataMeridian to manage your research datasets.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="label-text" htmlFor="name">Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input id="name" className="input-field pl-10" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Doe" />
          </div>
          {errors.name && <p className="mt-1 text-xs text-accent-danger">{errors.name}</p>}
        </div>

        <div>
          <label className="label-text" htmlFor="email">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input id="email" type="email" className="input-field pl-10" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@institution.org" />
          </div>
          {errors.email && <p className="mt-1 text-xs text-accent-danger">{errors.email}</p>}
        </div>

        <div>
          <label className="label-text" htmlFor="organization">Organization</label>
          <div className="relative">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input id="organization" className="input-field pl-10" value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="University / Lab" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text" htmlFor="password">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input id="password" type="password" className="input-field pl-10" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-accent-danger">{errors.password}</p>}
          </div>
          <div>
            <label className="label-text" htmlFor="confirmPassword">Confirm</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input id="confirmPassword" type="password" className="input-field pl-10" value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-accent-danger">{errors.confirmPassword}</p>}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <UserPlus size={16} /> {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-green hover:underline">Login</Link>
      </p>
    </AuthLayout>
  );
}
