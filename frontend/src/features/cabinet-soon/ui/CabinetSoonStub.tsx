import type { CabinetSoonStubCopy } from '@/features/cabinet-soon/lib/cabinet-soon-copy';
import { PageMeta } from '@/shared/ui/PageMeta';
import './CabinetSoonStub.css';

export type CabinetSoonStubProps = CabinetSoonStubCopy;

/**
 * Stage 2 placeholder: title + one line only (UX-DR8 — no demo data or skeletons).
 */
export function CabinetSoonStub({ title, line, metaTitle }: CabinetSoonStubProps) {
  return (
    <>
      <PageMeta title={metaTitle} robots="noindex,nofollow" />
      <section className="cabinet-soon-stub" aria-labelledby="cabinet-soon-stub-title">
        <h1 id="cabinet-soon-stub-title">{title}</h1>
        <p className="cabinet-soon-stub__line">{line}</p>
      </section>
    </>
  );
}
