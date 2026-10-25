import { CABINET_SOON_STUBS } from '@/features/cabinet-soon/lib/cabinet-soon-copy';
import { CabinetSoonStub } from '@/features/cabinet-soon/ui/CabinetSoonStub';

export function CabinetNutritionSoonPage() {
  return <CabinetSoonStub {...CABINET_SOON_STUBS.nutrition} headingLevel={2} />;
}
