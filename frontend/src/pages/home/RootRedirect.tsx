import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';

export function RootRedirect() {
  const [target, setTarget] = useState<'/login' | '/pool' | null>(null);

  useEffect(() => {
    let cancelled = false;

    void apiClient.GET('/api/auth/me').then(({ data, error }) => {
      if (!cancelled) {
        setTarget(data && !error ? '/pool' : '/login');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!target) {
    return null;
  }

  return <Navigate to={target} replace />;
}
