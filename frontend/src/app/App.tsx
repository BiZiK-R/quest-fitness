import { RouterProvider } from 'react-router-dom';
import { AntdProvider } from '@/shared/ui/AntdProvider';
import { appRouter } from './router';

export function App() {
  return (
    <AntdProvider>
      <RouterProvider router={appRouter} />
    </AntdProvider>
  );
}
