import { CABINET_SOON_STUBS } from '@/features/cabinet-soon/lib/cabinet-soon-copy';
import { CabinetSoonStub } from '@/features/cabinet-soon/ui/CabinetSoonStub';

export function CabinetMembershipSoonPage() {
  return <CabinetSoonStub {...CABINET_SOON_STUBS.membership} headingLevel={2} />;
}
