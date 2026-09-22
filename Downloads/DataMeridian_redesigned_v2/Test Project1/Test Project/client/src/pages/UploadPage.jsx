import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File as FileIcon, X, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { datasetService, aiService } from '../services';
import { useToast } from '../context/ToastContext';
import { formatBytes } from '../utils/format';
import useAIStatus from '../hooks/useAIStatus';
import AIStatusBanner from '../components/AIStatusBanner';

const DOMAINS = ['Genomics', 'Proteomics', 'Imaging', 'Clinical', 'Transcriptomics', 'Other'];
const TYPES = ['Sequence Data', 'Imaging Data', 'Tabular Data', 'Structural Data', 'Clinical Records'];
const LICENSES = ['CC-BY 4.0', 'CC0 1.0', 'MIT', 'CC-BY-NC 4.0'];
const VISIBILITIES = ['Public', 'Organization', 'Private', 'Restricted'];

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', domain: 'Genomics', type: 'Sequence Data', tags: '', license: 'CC-BY 4.0', visibility: 'Private' });
  const [stage, setStage] = useState('form'); // form | uploading | done
  const [progress, setProgress] = useState(0);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [createdDataset, setCreatedDataset] = useState(null);
  const aiStatus = useAIStatus();
  const toast = useToast();
  const navigate = useNavigate();

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  function onFileSelect(e) {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function runAiClassify() {
    if (!form.name) {
      toast.info('Enter a dataset name first for better AI suggestions');
      return;
    }
    setClassifying(true);
    try {
      const result = await aiService.classify({ name: form.name, description: form.description, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) });
      setAiSuggestion(result);
      setForm((f) => ({ ...f, domain: result.domain, type: result.datasetType || f.type }));
      toast.success('AI classification applied — review before submitting');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI classification failed');
    } finally {
      setClassifying(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) return toast.error('Dataset name is required');
    if (files.length === 0) return toast.error('Please add at least one file');

    setStage('uploading');
    setProgress(0);

    try {
      const { dataset } = await datasetService.create({
        name: form.name,
        description: form.description,
        domain: form.domain,
        type: form.type,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        visibility: form.visibility,
        metadata: { license: form.license },
      });

      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('changes', 'Initial upload');

      await datasetService.uploadVersion(dataset._id, formData, setProgress);

      setCreatedDataset(dataset);
      setStage('done');
      toast.success('Dataset uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setStage('form');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-50">Upload Dataset</h1>
        <p className="mt-1 text-sm text-ink-400">Add a new research dataset to DataMeridian.</p>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'form' && (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`card flex flex-col items-center justify-center border-2 border-dashed p-10 text-center transition-colors ${
                dragging ? 'border-accent-green bg-accent-green/5' : 'border-surface-500/60'
              }`}
            >
              <motion.div animate={{ y: dragging ? -4 : 0 }} className="mb-3 rounded-full bg-accent-green/10 p-4 text-accent-green">
                <UploadCloud size={28} />
              </motion.div>
              <p className="text-sm font-medium text-ink-100">Drag and drop files here, or</p>
              <label className="btn-secondary mt-3 cursor-pointer">
                Browse Files
                <input type="file" multiple className="hidden" onChange={onFileSelect} />
              </label>

              {files.length > 0 && (
                <div className="mt-5 w-full space-y-2 text-left">
                  {files.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg bg-surface-800/60 px-3 py-2">
                      <FileIcon size={16} className="text-accent-green" />
                      <span className="flex-1 truncate text-sm text-ink-200">{f.name}</span>
                      <span className="text-xs text-ink-500">{formatBytes(f.size)}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-ink-500 hover:text-accent-danger">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-50">Dataset Details</h3>
                <button type="button" onClick={runAiClassify} disabled={classifying || !aiStatus.configured} className="btn-ghost text-accent-green disabled:opacity-40">
                  {classifying ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Auto-classify with AI
                </button>
              </div>

              <AIStatusBanner status={aiStatus} />

              <div>
                <label className="label-text">Dataset Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Human Genome Variant Dataset" />
              </div>
              <div>
                <label className="label-text">Description</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the dataset contents, collection method, and purpose…" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-text">Research Domain</label>
                  <select className="input-field" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Dataset Type</label>
                  <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">License</label>
                  <select className="input-field" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })}>
                    {LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Visibility</label>
                  <select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                    {VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label-text">Tags (comma-separated)</label>
                <input className="input-field" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. sequencing, human, variant-calling" />
              </div>

              {aiSuggestion && (
                <div className="rounded-lg border border-accent-green/30 bg-accent-green/5 p-3 text-xs text-ink-300">
                  <span className="font-semibold text-accent-green">AI Classification:</span> Domain "{aiSuggestion.domain}", Type "{aiSuggestion.datasetType}" — {aiSuggestion.confidence}% confidence
                  {aiSuggestion.reasoning && <p className="mt-1 italic text-ink-400">"{aiSuggestion.reasoning}"</p>}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full py-3">
              <UploadCloud size={18} /> Upload Dataset
            </button>
          </motion.form>
        )}

        {stage === 'uploading' && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card p-10 text-center">
            <h3 className="text-lg font-semibold text-ink-50">Uploading Dataset</h3>
            <div className="mx-auto mt-6 h-3 w-full max-w-md overflow-hidden rounded-full bg-surface-600">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-green"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <p className="mt-3 text-sm text-ink-400">{progress}%</p>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/15 text-accent-green">
              <CheckCircle2 size={32} />
            </motion.div>
            <h3 className="text-lg font-semibold text-ink-50">Upload Complete</h3>
            <p className="mt-1 text-sm text-ink-400">Dataset successfully created.</p>
            <p className="mt-1 text-sm font-medium text-accent-green">Version {createdDataset?.currentVersion}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => navigate(`/app/datasets/${createdDataset._id}`)} className="btn-primary">View Dataset</button>
              <button onClick={() => { setStage('form'); setFiles([]); setForm({ name: '', description: '', domain: 'Genomics', type: 'Sequence Data', tags: '', license: 'CC-BY 4.0', visibility: 'Private' }); }} className="btn-secondary">Upload Another</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
