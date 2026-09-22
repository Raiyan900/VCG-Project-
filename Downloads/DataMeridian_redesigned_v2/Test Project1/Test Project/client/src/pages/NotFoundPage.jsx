import { Link } from 'react-router-dom';
import { Dna, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-green/10 text-accent-green">
        <Dna size={32} />
      </div>
      <h1 className="text-5xl font-bold text-ink-50">404</h1>
      <p className="mt-2 text-ink-400">This page could not be found.</p>
      <Link to="/" className="btn-primary mt-6">
        <ArrowLeft size={16} /> Back to Home
      </Link>
    </div>
  );
}
