import { useEffect, useState } from 'react';
import { File as FileIcon, Download } from 'lucide-react';
import { datasetService } from '../../services';
import { formatBytes, formatDate } from '../../utils/format';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';

export default function FilesTab({ datasetId }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const toast = useToast();

  useEffect(() => {
    datasetService.listVersions(datasetId).then((data) => setVersions(data.versions)).finally(() => setLoading(false));
  }, [datasetId]);

  const files = versions.flatMap((v) => (v.files || []).map((f) => ({ ...f, version: v.version })));

  async function downloadFile(file) {
    setDownloading(file.storedName);
    try {
      const response = await datasetService.downloadFile(datasetId, file.storedName);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.storedName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to download this file. It may no longer be available.');
    } finally {
      setDownloading(null);
    }
  }

  if (loading) return <div className="card p-8 text-center text-sm text-ink-500">Loading files…</div>;
  if (files.length === 0) return <EmptyState title="No files uploaded" description="Upload a version to add files to this dataset." />;

  return (
    <div className="card divide-y divide-surface-600/40 p-0">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <FileIcon size={18} className="shrink-0 text-accent-green" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-100">{f.originalName}</p>
            <p className="text-xs text-ink-500">v{f.version} • {formatBytes(f.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => downloadFile(f)}
            disabled={downloading === f.storedName}
            className="btn-ghost text-accent-green disabled:opacity-40"
            title={`Download ${f.originalName || f.storedName}`}
          >
            <Download size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
