import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  function validate() {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your research workspace.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="label-text" htmlFor="email">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              id="email"
              type="email"
              className="input-field pl-10"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@institution.org"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-accent-danger">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label-text" htmlFor="password">Password</label>
            <button type="button" className="mb-1.5 text-xs text-accent-green hover:underline">Forgot password?</button>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              id="password"
              type="password"
              className="input-field pl-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="mt-1 text-xs text-accent-danger">{errors.password}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <LogIn size={16} /> {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-accent-green hover:underline">Create Account</Link>
      </p>

    </AuthLayout>
  );
}
