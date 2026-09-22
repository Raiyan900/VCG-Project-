import { Link } from 'react-router-dom';
import { Dna, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-deep bg-brand-sidebar/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green/15 text-accent-green">
            <Dna size={18} />
          </div>
          <span className="text-sm font-bold tracking-tight text-ink-50">DataMeridian</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-ink-300 transition-colors hover:text-accent-green">Features</a>
          <a href="#lifecycle" className="text-sm text-ink-300 transition-colors hover:text-accent-green">Lifecycle</a>
          <a href="#ai" className="text-sm text-ink-300 transition-colors hover:text-accent-green">AI Tools</a>
          <a href="#stats" className="text-sm text-ink-300 transition-colors hover:text-accent-green">Statistics</a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link to="/app/dashboard" className="btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Login</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>

        <button className="text-ink-300 md:hidden" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-600/40 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#features" onClick={() => setOpen(false)} className="text-sm text-ink-300">Features</a>
            <a href="#lifecycle" onClick={() => setOpen(false)} className="text-sm text-ink-300">Lifecycle</a>
            <a href="#ai" onClick={() => setOpen(false)} className="text-sm text-ink-300">AI Tools</a>
            <Link to="/login" className="btn-secondary w-full">Login</Link>
            <Link to="/register" className="btn-primary w-full">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
