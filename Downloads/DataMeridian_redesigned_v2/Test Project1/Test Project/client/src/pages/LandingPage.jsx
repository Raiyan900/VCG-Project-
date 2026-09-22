import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Database, FileText, GitBranch, ShieldCheck, Users2, Compass, Sparkles, Copy, HardDrive,
  ArrowRight, UploadCloud, CheckCircle2, Activity, TrendingUp,
} from 'lucide-react';
import LandingNav from './landing/LandingNav';
import AnimatedStat from './landing/AnimatedStat';
import AnimatedBackground from '../components/AnimatedBackground';

const FEATURES = [
  { icon: Database, title: 'Dataset Management', desc: 'Create, organize, and track scientific datasets across your entire research lifecycle.' },
  { icon: FileText, title: 'Metadata Management', desc: 'Rich, structured metadata with completeness scoring and guided field recommendations.' },
  { icon: GitBranch, title: 'Version Control', desc: 'Full dataset version history with change logs and rollback-friendly timelines.' },
  { icon: ShieldCheck, title: 'Data Validation', desc: 'Automated integrity, schema, and metadata checks before datasets go live.' },
  { icon: Users2, title: 'Collaboration', desc: 'Invite collaborators with fine-grained roles and a transparent activity timeline.' },
  { icon: Compass, title: 'Dataset Discovery', desc: 'Powerful search and filtering across domains, tags, authors, and organizations.' },
  { icon: Sparkles, title: 'AI Classification', desc: 'Automatic domain classification and metadata suggestions powered by AI.' },
  { icon: Copy, title: 'Duplicate Detection', desc: 'Similarity analysis to catch redundant datasets before they waste storage.' },
  { icon: HardDrive, title: 'Storage Optimization', desc: 'Understand storage usage by type, organization, and lifecycle stage.' },
];

const LIFECYCLE = [
  { key: 'CREATE', desc: 'Register a new dataset with core details' },
  { key: 'VALIDATE', desc: 'Automated integrity & schema checks' },
  { key: 'VERSION', desc: 'Track every change with full history' },
  { key: 'SHARE', desc: 'Collaborate with fine-grained access' },
  { key: 'ARCHIVE', desc: 'Preserve datasets no longer active' },
  { key: 'RETIRE', desc: 'Formally retire with retention records' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-950">
      <AnimatedBackground />
      <div className="relative z-10">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 10%, rgba(8,203,0,0.10) 0%, transparent 40%), radial-gradient(circle at 85% 30%, rgba(37,57,0,0.30) 0%, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="badge border border-accent-green/30 bg-accent-green/10 text-accent-green"
          >
            <motion.span animate={{ rotate: [0, 15, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkles size={12} />
            </motion.span>
            AI-Powered Research Data Platform
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-4xl font-bold tracking-tight text-ink-50 sm:text-5xl lg:text-6xl"
          >
            Research Data. Organized for Discovery.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-base text-ink-300 sm:text-lg"
          >
            A complete research data lifecycle platform for managing, validating, versioning, sharing, and preserving scientific datasets.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              <Compass size={18} /> Explore Datasets
            </Link>
            <Link to="/register" className="btn-secondary px-6 py-3 text-base">
              <UploadCloud size={18} /> Upload Dataset
            </Link>
          </motion.div>
        </div>

        {/* Animated dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-surface-600/50 bg-surface-800/60 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-ink-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink-100/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-green/60" />
              <span className="ml-3 text-xs text-ink-500">DataMeridian — Dashboard</span>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
              {[
                { label: 'Total Datasets', value: '1,284', icon: Database, accent: 'text-accent-green' },
                { label: 'Active', value: '342', icon: Activity, accent: 'text-accent-green' },
                { label: 'Archived', value: '618', icon: HardDrive, accent: 'text-accent-green' },
                { label: 'Storage Optimized', value: '1.8 TB', icon: TrendingUp, accent: 'text-accent-green' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="rounded-xl border border-surface-600/50 bg-surface-800/50 p-4"
                >
                  <s.icon size={18} className={s.accent} />
                  <p className="mt-3 text-xl font-bold text-ink-50">{s.value}</p>
                  <p className="text-xs text-ink-400">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-heading">Everything researchers need in one platform</h2>
            <p className="mt-3 text-ink-400">A complete toolkit for the full research data lifecycle — from raw upload to long-term preservation.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                whileHover={{ y: -4 }}
                className="card card-hover p-6"
              >
                <div className="inline-flex rounded-lg bg-accent-green/10 p-2.5 text-accent-green">
                  <f.icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink-50">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lifecycle */}
      <section id="lifecycle" className="border-y border-surface-600/40 bg-surface-850/60 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-heading">The dataset lifecycle</h2>
            <p className="mt-3 text-ink-400">Every dataset progresses through a clear, auditable lifecycle.</p>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
            {LIFECYCLE.map((stage, i) => (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center"
              >
                <div className="card w-40 p-4 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent-green/15 text-sm font-bold text-accent-green">
                    {i + 1}
                  </div>
                  <p className="mt-3 text-sm font-bold tracking-wide text-ink-50">{stage.key}</p>
                  <p className="mt-1 text-xs text-ink-400">{stage.desc}</p>
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <ArrowRight size={18} className="mx-2 hidden text-ink-500 sm:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge border border-accent-green/30 bg-accent-green/10 text-accent-green">
              <Sparkles size={12} /> AI-Powered
            </span>
            <h2 className="mt-4 section-heading">AI-Powered Research Data Management</h2>
            <p className="mt-4 text-ink-400">
              DataMeridian uses AI to classify datasets, generate metadata suggestions, detect duplicates, identify
              incomplete metadata, and improve dataset discoverability — accelerating your research workflow.
            </p>
            <ul className="mt-6 space-y-3">
              {['Automatic domain & type classification', 'AI-suggested metadata & keywords', 'Duplicate & similarity detection', 'Metadata quality analysis'].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-ink-200">
                  <CheckCircle2 size={16} className="text-accent-green" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent-green" /> Analyzing dataset…
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-surface-600/50 bg-surface-800/60 p-3.5">
                <p className="text-xs text-ink-500">Research Domain</p>
                <p className="mt-1 text-sm font-semibold text-accent-green">Genomics</p>
              </div>
              <div className="rounded-lg border border-surface-600/50 bg-surface-800/60 p-3.5">
                <p className="text-xs text-ink-500">Dataset Type</p>
                <p className="mt-1 text-sm font-semibold text-accent-green">Sequence Data</p>
              </div>
              <div className="rounded-lg border border-surface-600/50 bg-surface-800/60 p-3.5">
                <p className="text-xs text-ink-500">Confidence</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-600">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '96%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-accent-green"
                  />
                </div>
                <p className="mt-1 text-right text-xs text-ink-400">96%</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-surface-600/40 bg-surface-850/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <AnimatedStat target={1284} suffix="+" label="Datasets" />
          <AnimatedStat target={342} label="Active" />
          <AnimatedStat target={618} label="Archived" />
          <AnimatedStat target={84} label="Duplicates Detected" />
          <AnimatedStat target={18} decimals={1} suffix=" TB" label="Storage Optimized" />
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="section-heading">Ready to organize your research data?</h2>
        <p className="mx-auto mt-3 max-w-lg text-ink-400">Join researchers and institutions using DataMeridian to manage their scientific data lifecycle.</p>
        <div className="mt-8">
          <Link to="/register" className="btn-primary px-6 py-3 text-base">
            Get Started for Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-surface-600/40 px-4 py-8 text-center text-xs text-ink-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} DataMeridian. Built for researchers, universities, and laboratories.
      </footer>
      </div>
    </div>
  );
}
