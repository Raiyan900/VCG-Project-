import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, FileWarning, Copy, Loader2, XCircle } from 'lucide-react';
import { aiService } from '../services';
import { useToast } from '../context/ToastContext';
import useAIStatus from '../hooks/useAIStatus';
import AIStatusBanner from '../components/AIStatusBanner';

const TOOLS = [
  { key: 'classify', label: 'Automatic Classification', icon: Wand2, desc: 'Classify a dataset by domain and type' },
  { key: 'metadata', label: 'Metadata Generation', icon: Sparkles, desc: 'Generate suggested metadata fields' },
  { key: 'quality', label: 'Metadata Quality', icon: FileWarning, desc: 'Detect missing or inconsistent metadata' },
  { key: 'duplicates', label: 'Duplicate Detection', icon: Copy, desc: 'Find potentially similar datasets' },
];

export default function AIToolsPage() {
  const [active, setActive] = useState('classify');
  const [input, setInput] = useState({ name: '', description: '', tags: '' });
  const [result, setResult] = useState(null);
  const [state, setState] = useState('idle'); // idle | analyzing | completed | failed
  const [error, setError] = useState('');
  const aiStatus = useAIStatus();
  const toast = useToast();

  async function runTool() {
    setState('analyzing');
    setResult(null);
    setError('');
    try {
      let res;
      if (active === 'classify') {
        res = await aiService.classify({ name: input.name, description: input.description, tags: input.tags.split(',').map((t) => t.trim()).filter(Boolean) });
      } else if (active === 'metadata') {
        res = await aiService.generateMetadata({ name: input.name, description: input.description });
      } else if (active === 'duplicates') {
        res = await aiService.detectDuplicates();
      } else {
        toast.info('Open a dataset and use the Metadata tab to run quality analysis on it directly.');
        setState('idle');
        return;
      }
      setResult(res);
      setState('completed');
    } catch (err) {
      const message = err.response?.data?.message || 'AI tool failed to run';
      setError(message);
      setState('failed');
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">AI Tools</h1>
        <p className="mt-1 text-sm text-ink-400">
          AI-assisted classification, metadata generation, quality analysis, and duplicate detection for your datasets.
        </p>
      </div>

      <AIStatusBanner status={aiStatus} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {TOOLS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActive(t.key); setResult(null); setState('idle'); setError(''); }}
              className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                active === t.key ? 'border-accent-green bg-accent-green/5' : 'border-surface-600/60 hover:border-surface-500'
              }`}
            >
              <t.icon size={18} className={active === t.key ? 'text-accent-green' : 'text-ink-400'} />
              <div>
                <p className="text-sm font-medium text-ink-100">{t.label}</p>
                <p className="mt-0.5 text-xs text-ink-500">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="card p-6 lg:col-span-2">
          {active !== 'duplicates' && active !== 'quality' && (
            <div className="space-y-3">
              <input className="input-field" placeholder="Dataset name" value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} />
              <textarea className="input-field" rows={3} placeholder="Description" value={input.description} onChange={(e) => setInput({ ...input, description: e.target.value })} />
              <input className="input-field" placeholder="Tags (comma-separated)" value={input.tags} onChange={(e) => setInput({ ...input, tags: e.target.value })} />
            </div>
          )}

          {active === 'quality' && (
            <p className="text-sm text-ink-400">Open any dataset's Metadata tab to run quality analysis on its real metadata.</p>
          )}

          {active !== 'quality' && (
            <button onClick={runTool} disabled={state === 'analyzing'} className="btn-primary mt-4">
              {state === 'analyzing' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {state === 'analyzing' ? 'Analyzing…' : 'Run Analysis'}
            </button>
          )}

          {state === 'failed' && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent-danger/30 bg-accent-danger/5 p-3 text-sm text-accent-danger">
              <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <AnimatePresence>
            {result && state === 'completed' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-3 rounded-lg border border-surface-600/60 bg-surface-800/60 p-4">
                {active === 'classify' && (
                  <>
                    <ResultRow label="Domain" value={result.domain} />
                    <ResultRow label="Dataset Type" value={result.datasetType} />
                    <ResultRow label="Research Area" value={result.researchArea} />
                    <ResultRow label="Data Modality" value={result.dataModality} />
                    <ResultRow label="Keywords" value={result.keywords?.join(', ')} />
                    <ResultRow label="Confidence" value={`${result.confidence}%`} />
                    <ResultRow label="Reasoning" value={result.reasoning} />
                  </>
                )}
                {active === 'metadata' && (
                  <>
                    <ResultRow label="Suggested Description" value={result.suggestions?.description} />
                    <ResultRow label="Domain" value={result.suggestions?.domain} />
                    <ResultRow label="Keywords" value={result.suggestions?.keywords?.join(', ')} />
                    <ResultRow label="Tags" value={result.suggestions?.tags?.join(', ')} />
                    <ResultRow label="Organization" value={result.suggestions?.organization} />
                    <ResultRow label="Reasoning" value={result.reasoning} />
                  </>
                )}
                {active === 'duplicates' && (
                  <p className="text-sm text-ink-300">{result.pairs.length} potential duplicate/related pair(s) found across the catalog.</p>
                )}
                <p className="pt-2 text-[11px] text-ink-500">{result.provider === 'ai' ? `AI provider (${aiStatus.model})` : 'rule-based analysis'} • generated at {new Date().toLocaleTimeString()}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-sm font-medium text-ink-100">{value}</p>
    </div>
  );
}
