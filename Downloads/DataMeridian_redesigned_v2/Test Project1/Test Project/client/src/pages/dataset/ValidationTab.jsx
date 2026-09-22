import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { datasetService } from '../../services';
import { useToast } from '../../context/ToastContext';

export default function ValidationTab({ dataset, onUpdate }) {
  const canValidate = Boolean(dataset.access?.canValidate);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const toast = useToast();

  function load() {
    datasetService.latestValidation(dataset._id).then((data) => setValidation(data.validation)).finally(() => setLoading(false));
  }

  useEffect(load, [dataset._id]);

  async function runValidation() {
    setRunning(true);
    try {
      const { validation: newValidation, dataset: updated, access } = await datasetService.validate(dataset._id);
      setValidation(newValidation);
      onUpdate({ ...updated, access });
      toast.success(`Validation completed: ${newValidation.status}`);
    } catch (err) {
      toast.error('Validation failed to run');
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <div className="card p-8 text-center text-sm text-ink-500">Loading validation status…</div>;

  return (
    <div className="space-y-5">
      <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-semibold text-ink-50">Overall Validation Score</h3>
          <p className="mt-1 text-3xl font-bold text-accent-green">{validation?.score ?? 0}%</p>
        </div>
        <button onClick={runValidation} disabled={running || !canValidate} className="btn-primary">
          <ShieldCheck size={16} /> {running ? 'Validating…' : 'Run Validation'}
        </button>
      </div>

      {validation ? (
        <div className="card divide-y divide-surface-600/40 p-0">
          {validation.checks.map((check, i) => (
            <motion.div
              key={check.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              {check.passed ? (
                <CheckCircle2 size={18} className="shrink-0 text-accent-green" />
              ) : (
                <AlertTriangle size={18} className="shrink-0 text-accent-warn" />
              )}
              <div>
                <p className="text-sm font-medium text-ink-100">{check.name}</p>
                <p className="text-xs text-ink-500">{check.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-sm text-ink-500">
          <XCircle size={22} className="mx-auto mb-2 text-ink-500" />
          No validation has been run yet for this dataset.
        </div>
      )}
    </div>
  );
}
