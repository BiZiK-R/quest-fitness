import type { CabinetSoonStubCopy } from '@/features/cabinet-soon/lib/cabinet-soon-copy';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageMeta } from '@/shared/ui/PageMeta';

export type CabinetSoonStubProps = CabinetSoonStubCopy & {
  /** 2 — когда h1 экрана уже в appbar (вкладки кабинета); 1 — экран без заголовка в шапке. */
  headingLevel?: 1 | 2;
};

/**
 * «Скоро»-заглушка Этапа 2 (DESIGN → soon-stub): крем-панель, водяной знак, заголовок + одна строка.
 * Без демо-данных и скелетонов (UX-DR8).
 */
export function CabinetSoonStub({ title, line, metaTitle, headingLevel = 1 }: CabinetSoonStubProps) {
  return (
    <>
      <PageMeta title={metaTitle} robots="noindex,nofollow" />
      <EmptyState watermark size="title" headingLevel={headingLevel} title={title} description={line} />
    </>
  );
}
