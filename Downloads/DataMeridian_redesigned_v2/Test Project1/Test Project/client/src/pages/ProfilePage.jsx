import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Database, GitBranch, Users2, Quote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { datasetService } from '../services';
import StatCard from '../components/StatCard';

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ datasets: 0, versions: 0, collaborations: 0, citations: 0 });

  useEffect(() => {
    datasetService.list().then((data) => {
      const mine = data.datasets.filter((d) => d.owner?._id === user?.id || d.owner === user?.id);
      const citations = mine.reduce((s, d) => s + (d.citationCount || 0), 0);
      setStats({ datasets: mine.length, versions: mine.length, collaborations: Math.max(1, Math.floor(mine.length / 2)), citations });
    });
  }, [user]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-green/15 text-3xl font-bold text-accent-green">
            {user?.name?.[0]}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-ink-50">{user?.name}</h1>
            <div className="mt-1 flex flex-col gap-1 text-sm text-ink-400 sm:flex-row sm:gap-4">
              <span className="flex items-center justify-center gap-1.5 sm:justify-start"><Mail size={14} /> {user?.email}</span>
              <span className="flex items-center justify-center gap-1.5 sm:justify-start"><Building2 size={14} /> {user?.organization || 'No organization'}</span>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {(user?.researchAreas || []).map((area) => (
                <span key={area} className="rounded-full bg-surface-700/60 px-2.5 py-1 text-xs text-ink-300">{area}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Database} label="Datasets Created" value={stats.datasets} accent="teal" />
        <StatCard icon={GitBranch} label="Versions Published" value={stats.versions} accent="cyan" delay={0.05} />
        <StatCard icon={Users2} label="Collaborations" value={stats.collaborations} accent="violet" delay={0.1} />
        <StatCard icon={Quote} label="Citations" value={stats.citations} accent="amber" delay={0.15} />
      </div>
    </div>
  );
}
