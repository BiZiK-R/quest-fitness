import { useEffect } from 'react';

export type PageMetaProps = {
  title?: string;
  robots?: string;
};

/**
 * Sets document title and optional robots meta for protected routes.
 */
export function PageMeta({ title, robots }: PageMetaProps) {
  useEffect(() => {
    if (!title) {
      return;
    }
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);

  useEffect(() => {
    if (!robots) {
      return;
    }

    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }

    const previousContent = meta.content;
    meta.content = robots;

    return () => {
      if (created) {
        meta?.remove();
        return;
      }
      meta!.content = previousContent;
    };
  }, [robots]);

  return null;
}
