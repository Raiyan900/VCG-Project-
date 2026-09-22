import { useEffect, useState } from 'react';
import { aiService } from '../services';

/** Fetches whether a real AI provider is configured on the backend. */
export default function useAIStatus() {
  const [status, setStatus] = useState({ configured: false, provider: null, model: null, loading: true });

  useEffect(() => {
    let mounted = true;
    aiService
      .status()
      .then((data) => {
        if (mounted) setStatus({ ...data, loading: false });
      })
      .catch(() => {
        if (mounted) setStatus({ configured: false, provider: null, model: null, loading: false });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return status;
}
