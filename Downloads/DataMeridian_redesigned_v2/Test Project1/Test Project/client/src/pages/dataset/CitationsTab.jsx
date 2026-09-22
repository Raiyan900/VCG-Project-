import { useEffect, useState } from 'react';
import { Copy, Quote } from 'lucide-react';
import { datasetService } from '../../services';
import { useToast } from '../../context/ToastContext';

export default function CitationsTab({ dataset }) {
  const [citation, setCitation] = useState(null);
  const toast = useToast();

  useEffect(() => {
    datasetService.citations(dataset._id).then(setCitation);
  }, [dataset._id]);

  function copyCitation() {
    if (!citation) return;
    navigator.clipboard.writeText(citation.citation);
    toast.success('Citation copied to clipboard');
  }

  return (
    <div className="card max-w-2xl p-6">
      <div className="flex items-center gap-2 text-accent-green">
        <Quote size={18} />
        <h3 className="text-sm font-semibold text-ink-50">Cite this Dataset</h3>
      </div>
      {citation && (
        <>
          <div className="mt-4 rounded-lg border border-surface-600/60 bg-surface-800/60 p-4 font-mono text-sm leading-relaxed text-ink-200">
            {citation.citation}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <button onClick={copyCitation} className="btn-secondary">
              <Copy size={14} /> Copy Citation
            </button>
            <span className="text-ink-500">DOI: <span className="text-ink-300">{citation.doi}</span></span>
            <span className="text-ink-500">Citations: <span className="text-ink-300">{citation.citationCount}</span></span>
          </div>
        </>
      )}
    </div>
  );
}
