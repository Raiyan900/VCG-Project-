import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, Check, X, Loader2, FileWarning } from 'lucide-react';
import { datasetService, aiService } from '../../services';
import { useToast } from '../../context/ToastContext';
import useAIStatus from '../../hooks/useAIStatus';
import AIStatusBanner from '../../components/AIStatusBanner';

const NEEDS_CONFIRMATION = 'Needs confirmation';

export default function MetadataTab({ dataset, onUpdate }) {
  const canEditMetadata = Boolean(dataset.access?.canMetadataEdit);
  const [form, setForm] = useState({
    organism: dataset.metadata?.organism || '',
    collectionMethod: dataset.metadata?.collectionMethod || '',
    license: dataset.metadata?.license || '',
    keywords: (dataset.metadata?.keywords || []).join(', '),
    authors: (dataset.metadata?.authors || []).join(', '),
    institution: dataset.metadata?.institution || '',
    contact: dataset.metadata?.contact || '',
  });
  const [completeness, setCompleteness] = useState(null);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [suggestions, setSuggestions] = useState(null); // { field: { value, status: 'pending'|'accepted'|'rejected' } }
  const [quality, setQuality] = useState(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const aiStatus = useAIStatus();
  const toast = useToast();

  useEffect(() => {
    datasetService.metadataCompleteness(dataset._id).then((data) => setCompleteness(data.completeness));
  }, [dataset._id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        authors: form.authors.split(',').map((a) => a.trim()).filter(Boolean),
      };
      const { dataset: updated, completeness: newCompleteness, access } = await datasetService.updateMetadata(dataset._id, payload);
      setCompleteness(newCompleteness);
      onUpdate({ ...updated, access });
      toast.success('Metadata updated');
    } catch (err) {
      toast.error('Failed to update metadata');
    } finally {
      setSaving(false);
    }
  }

  async function enrichWithAI() {
    setEnriching(true);
    try {
      const result = await aiService.generateMetadata({ datasetId: dataset._id });
      const s = result.suggestions;
      const next = {};
      // Only surface fields that offer real, reviewable evidence (skip "Needs confirmation").
      const candidates = {
        collectionMethod: s.collectionMethod,
        license: s.license,
        institution: s.institution,
        keywords: s.keywords?.join(', '),
      };
      Object.entries(candidates).forEach(([key, value]) => {
        if (value && value !== NEEDS_CONFIRMATION && value !== form[key]) {
          next[key] = { value, status: 'pending' };
        }
      });
      setSuggestions({ fields: next, reasoning: result.reasoning });
      if (Object.keys(next).length === 0) {
        toast.info('AI found no new metadata suggestions beyond what is already recorded.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI metadata generation failed');
    } finally {
      setEnriching(false);
    }
  }

  function acceptSuggestion(field) {
    setForm((f) => ({ ...f, [field]: suggestions.fields[field].value }));
    setSuggestions((prev) => ({ ...prev, fields: { ...prev.fields, [field]: { ...prev.fields[field], status: 'accepted' } } }));
  }

  function rejectSuggestion(field) {
    setSuggestions((prev) => ({ ...prev, fields: { ...prev.fields, [field]: { ...prev.fields[field], status: 'rejected' } } }));
  }

  function acceptAll() {
    const updates = {};
    Object.entries(suggestions.fields).forEach(([field, s]) => {
      if (s.status === 'pending') updates[field] = s.value;
    });
    setForm((f) => ({ ...f, ...updates }));
    setSuggestions((prev) => {
      const fields = { ...prev.fields };
      Object.keys(fields).forEach((field) => {
        if (fields[field].status === 'pending') fields[field] = { ...fields[field], status: 'accepted' };
      });
      return { ...prev, fields };
    });
    toast.success('All AI suggestions applied to the form — review and click Save Metadata to persist.');
  }

  async function runQualityAnalysis() {
    setQualityLoading(true);
    try {
      const result = await aiService.metadataQuality(dataset._id);
      setQuality(result);
    } catch (err) {
      toast.error('Failed to run metadata quality analysis');
    } finally {
      setQualityLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <AIStatusBanner status={aiStatus} />

        <form onSubmit={handleSave} className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-50">Metadata Fields</h3>
            <button type="button" onClick={enrichWithAI} disabled={enriching || !aiStatus.configured || !canEditMetadata} className="btn-ghost text-accent-green disabled:opacity-40">
              {enriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Enrich Metadata
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">Organism</label>
              <input className="input-field" value={form.organism} onChange={(e) => setForm({ ...form, organism: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Collection Method</label>
              <input className="input-field" value={form.collectionMethod} onChange={(e) => setForm({ ...form, collectionMethod: e.target.value })} />
            </div>
            <div>
              <label className="label-text">License</label>
              <input className="input-field" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Institution</label>
              <input className="input-field" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Keywords (comma-separated)</label>
              <input className="input-field" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Authors (comma-separated)</label>
              <input className="input-field" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Contact</label>
              <input className="input-field" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving || !canEditMetadata} className="btn-primary">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Metadata'}
          </button>
        </form>

        <AnimatePresence>
          {suggestions && Object.keys(suggestions.fields).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card space-y-3 border-accent-green/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-50">AI Suggested Metadata</h3>
                <button onClick={acceptAll} className="btn-ghost text-accent-green">Accept All</button>
              </div>
              {suggestions.reasoning && <p className="text-xs text-ink-500">{suggestions.reasoning}</p>}
              <div className="space-y-2">
                {Object.entries(suggestions.fields).map(([field, s]) => (
                  <div key={field} className="flex items-center justify-between gap-3 rounded-lg border border-surface-600/50 bg-surface-800/50 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium capitalize text-ink-400">{field.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={`badge border text-[10px] ${
                          s.status === 'accepted' ? 'border-accent-green/30 bg-accent-green/10 text-accent-green'
                          : s.status === 'rejected' ? 'border-ink-500/30 bg-ink-500/10 text-ink-500'
                          : 'border-accent-green/30 bg-accent-green/10 text-accent-green'
                        }`}>
                          {s.status === 'accepted' ? 'Accepted' : s.status === 'rejected' ? 'Rejected' : 'AI Suggested'}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-ink-100">{s.value}</p>
                    </div>
                    {s.status === 'pending' && (
                      <div className="flex shrink-0 gap-1.5">
                        <button onClick={() => acceptSuggestion(field)} className="rounded-lg p-1.5 text-accent-green hover:bg-surface-700/60" title="Accept"><Check size={15} /></button>
                        <button onClick={() => rejectSuggestion(field)} className="rounded-lg p-1.5 text-ink-400 hover:bg-surface-700/60" title="Reject"><X size={15} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-ink-500">Accepted suggestions are applied to the form only — click Save Metadata to persist them.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-50">Metadata Completeness</h3>
          {completeness && (
            <>
              <p className="mt-4 text-3xl font-bold text-accent-green">{completeness.percent}%</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-700">
                <div className="h-full rounded-full bg-accent-green transition-all" style={{ width: `${completeness.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink-400">{completeness.filled} of {completeness.total} recommended fields completed</p>
            </>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-50">AI Quality Analysis</h3>
            <button onClick={runQualityAnalysis} disabled={qualityLoading} className="btn-ghost text-accent-green">
              {qualityLoading ? <Loader2 size={14} className="animate-spin" /> : <FileWarning size={14} />}
            </button>
          </div>
          {quality ? (
            <>
              <p className="mt-3 text-2xl font-bold text-accent-green">{quality.score}%</p>
              {quality.criticalIssues?.length > 0 && (
                <IssueList label="Critical" items={quality.criticalIssues} color="text-accent-danger" />
              )}
              {quality.missingFields?.length > 0 && (
                <IssueList label="Missing fields" items={quality.missingFields} color="text-accent-warn" />
              )}
              {quality.warnings?.length > 0 && (
                <IssueList label="Warnings" items={quality.warnings} color="text-accent-warn" />
              )}
              {quality.suggestions?.length > 0 && (
                <IssueList label="Suggestions" items={quality.suggestions} color="text-ink-300" />
              )}
            </>
          ) : (
            <p className="mt-3 text-xs text-ink-500">Run analysis to check for missing fields, inconsistent metadata, and quality issues based on this dataset's real metadata.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueList({ label, items, color }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item} className={`text-xs ${color}`}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
