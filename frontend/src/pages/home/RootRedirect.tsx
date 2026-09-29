import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { resolveRootPathForRole } from '@/shared/auth/resolvePostLoginPath';
import { apiClient } from '@/shared/api/client';

export function RootRedirect() {
  const [target, setTarget] = useState<'/login' | '/pool' | '/cabinet/workouts' | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    void apiClient.GET('/api/auth/me').then(({ data, error }) => {
      if (cancelled) {
        return;
      }
      if (data && !error) {
        setTarget(resolveRootPathForRole(data.role));
      } else {
        setTarget('/login');
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
