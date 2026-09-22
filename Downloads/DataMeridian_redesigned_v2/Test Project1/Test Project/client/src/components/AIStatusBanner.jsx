import { AlertTriangle, Sparkles } from 'lucide-react';

export default function AIStatusBanner({ status }) {
  if (status.loading) return null;

  if (!status.configured) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-accent-warn/30 bg-accent-warn/5 p-3.5 text-sm text-ink-300">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-accent-warn" />
        <div>
          <p className="font-medium text-accent-warn">AI provider is not configured</p>
          <p className="mt-0.5 text-xs text-ink-400">Configure the AI API key in the server environment to enable AI features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-accent-green/30 bg-accent-green/5 px-3.5 py-2 text-xs text-ink-300">
      <Sparkles size={14} className="text-accent-green" />
      AI provider connected — <span className="text-ink-200">{status.provider}</span> · <span className="text-ink-200">{status.model}</span>
    </div>
  );
}
