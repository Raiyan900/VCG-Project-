import { motion } from 'framer-motion';

const ACCENT_CLASSES = {
  teal: 'bg-accent-green/10 text-accent-green',
  cyan: 'bg-accent-green/10 text-accent-green',
  violet: 'bg-accent-green/10 text-accent-green',
  amber: 'bg-accent-warn/10 text-accent-warn',
  rose: 'bg-accent-danger/10 text-accent-danger',
};

export default function StatCard({ icon: Icon, label, value, trend, accent = 'teal', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card card-hover p-5"
    >
      <div className="flex items-start justify-between">
        <motion.div
          whileHover={{ rotate: 8, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className={`rounded-lg p-2.5 ${ACCENT_CLASSES[accent] || ACCENT_CLASSES.teal}`}
        >
          <Icon size={20} />
        </motion.div>
        {trend && (
          <span className={`text-xs font-medium ${trend.startsWith('-') ? 'text-accent-danger' : 'text-accent-green'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 animate-countUp text-2xl font-bold tracking-tight text-ink-50">{value}</p>
      <p className="mt-1 text-sm text-ink-400">{label}</p>
    </motion.div>
  );
}
