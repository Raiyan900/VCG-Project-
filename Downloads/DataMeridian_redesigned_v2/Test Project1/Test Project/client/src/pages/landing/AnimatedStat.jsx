import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

function useCountUp(target, inView, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    let start = null;
    let raf;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return value;
}

export default function AnimatedStat({ target, suffix = '', prefix = '', label, decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const value = useCountUp(target, inView);
  const displayValue = decimals > 0 ? (value / 10 ** decimals).toFixed(decimals) : value.toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <p className="text-3xl font-bold tracking-tight text-ink-50 sm:text-4xl">
        {prefix}{displayValue}{suffix}
      </p>
      <p className="mt-1.5 text-sm text-ink-400">{label}</p>
    </motion.div>
  );
}