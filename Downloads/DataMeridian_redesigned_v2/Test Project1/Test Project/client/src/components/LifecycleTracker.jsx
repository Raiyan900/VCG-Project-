import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const STAGES = ['create', 'validate', 'version', 'share', 'archive', 'retire'];
const LABELS = { create: 'Create', validate: 'Validate', version: 'Version', share: 'Share', archive: 'Archive', retire: 'Retire' };

export default function LifecycleTracker({ lifecycle = {}, compact = false }) {
  const activeIndex = (() => {
    for (let i = STAGES.length - 1; i >= 0; i -= 1) {
      if (lifecycle[STAGES[i]]) return i;
    }
    return 0;
  })();

  return (
    <div className="flex items-center">
      {STAGES.map((stage, i) => {
        const done = lifecycle[stage];
        const isCurrent = i === activeIndex;
        return (
          <div key={stage} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  done
                    ? 'border-accent-green bg-accent-green/20 text-accent-green'
                    : isCurrent
                    ? 'border-accent-green bg-accent-green/10 text-accent-green animate-pulse'
                    : 'border-surface-500 bg-surface-800 text-ink-500'
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </motion.div>
              {!compact && <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">{LABELS[stage]}</span>}
            </div>
            {i < STAGES.length - 1 && (
              <div className={`mx-1.5 h-0.5 w-6 sm:w-10 ${done ? 'bg-accent-green' : 'bg-surface-600'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
