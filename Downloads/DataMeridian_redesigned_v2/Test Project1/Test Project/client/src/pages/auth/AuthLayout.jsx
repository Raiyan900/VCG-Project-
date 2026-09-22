import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Dna, ArrowLeft } from 'lucide-react';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-surface-950">
      <AnimatedBackground variant="auth" />
      <div className="relative z-10 hidden w-1/2 overflow-hidden bg-surface-850/40 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-20 animate-gradientShift bg-[length:200%_200%]" style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(8, 203, 0, 0.12) 0%, transparent 35%), radial-gradient(circle at 80% 70%, rgba(37, 57, 0, 0.22) 0%, transparent 35%)',
        }} />
        <div className="relative flex items-center gap-2.5">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-green/15 text-accent-green"
          >
            <Dna size={20} />
          </motion.div>
          <span className="text-base font-bold text-ink-50">DataMeridian</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <h2 className="text-3xl font-bold leading-tight text-ink-50">
            Research data. <br /> Organized for discovery.
          </h2>
          <p className="mt-4 max-w-md text-ink-400">
            Manage, validate, version, and preserve your scientific datasets on a single trusted platform.
          </p>
        </motion.div>
        <p className="relative text-xs text-ink-500">© {new Date().getFullYear()} DataMeridian. All rights reserved.</p>
      </div>

      <div className="relative z-10 flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 transition-colors hover:text-accent-green">
            <ArrowLeft size={15} /> Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-ink-50">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
