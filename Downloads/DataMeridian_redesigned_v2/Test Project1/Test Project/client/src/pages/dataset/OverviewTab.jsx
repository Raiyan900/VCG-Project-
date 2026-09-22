import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Loader2, Check } from 'lucide-react';
import { formatBytes, formatDateTime } from '../../utils/format';
import { datasetService, aiService } from '../../services';
import { useToast } from '../../context/ToastContext';
import useAIStatus from '../../hooks/useAIStatus';
import AIStatusBanner from '../../components/AIStatusBanner';

export default function OverviewTab({ dataset, onUpdate }) {
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState(null);
  const [applying, setApplying] = useState(false);
  const aiStatus = useAIStatus();
  const toast = useToast();

  async function runClassify() {
    setClassifying(true);
    setClassification(null);
    try {
      const result = await aiService.classify({ datasetId: dataset._id });
      setClassification(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI classification failed');
    } finally {
      setClassifying(false);
    }
  }

  async function applyClassification() {
    if (!classification) return;
    setApplying(true);
    try {
      const mergedTags = Array.from(new Set([...(dataset.tags || []), ...classification.tags]));
      const { dataset: updated } = await datasetService.update(dataset._id, {
        domain: classification.domain,
        type: classification.datasetType,
        tags: mergedTags,
      });
      onUpdate?.(updated);
      toast.success('AI classification applied to dataset');
      setClassification(null);
    } catch (err) {
      toast.error('Failed to apply classification');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-50">Description</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">{dataset.description || 'No description provided.'}</p>

          <h3 className="mt-6 text-sm font-semibold text-ink-50">Tags</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(dataset.tags || []).map((tag) => (
              <span key={tag} className="rounded-full bg-surface-700/60 px-2.5 py-1 text-xs text-ink-300">{tag}</span>
            ))}
            {(!dataset.tags || dataset.tags.length === 0) && <span className="text-sm text-ink-500">No tags</span>}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-50">AI Classification</h3>
            <button onClick={runClassify} disabled={classifying || !aiStatus.configured} className="btn-ghost text-accent-green disabled:opacity-40">
              {classifying ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Classify Dataset
            </button>
          </div>
          <div className="mt-3">
            <AIStatusBanner status={aiStatus} />
          </div>
          <AnimatePresence>
            {classification && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-2 rounded-lg border border-accent-green/30 bg-accent-green/5 p-4">
                <Row label="Domain" value={classification.domain} />
                <Row label="Dataset Type" value={classification.datasetType} />
                <Row label="Research Area" value={classification.researchArea} />
                <Row label="Data Modality" value={classification.dataModality} />
                <Row label="Keywords" value={classification.keywords?.join(', ')} />
                <Row label="Confidence" value={`${classification.confidence}%`} />
                {classification.reasoning && <p className="pt-1 text-xs italic text-ink-400">"{classification.reasoning}"</p>}
                <button onClick={applyClassification} disabled={applying} className="btn-primary mt-2">
                  <Check size={14} /> {applying ? 'Applying…' : 'Accept & Apply to Dataset'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-ink-50">Details</h3>
        {[
          ['Owner', dataset.owner?.name],
          ['Organization', dataset.organization || '—'],
          ['Type', dataset.type],
          ['Domain', dataset.domain],
          ['Visibility', dataset.visibility],
          ['Size', formatBytes(dataset.size)],
          ['Created', formatDateTime(dataset.createdAt)],
          ['Updated', formatDateTime(dataset.updatedAt)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-ink-500">{label}</span>
            <span className="font-medium text-ink-100">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-ink-500">{label}</span>
      <span className="text-right font-medium text-ink-100">{value}</span>
    </div>
  );
}
