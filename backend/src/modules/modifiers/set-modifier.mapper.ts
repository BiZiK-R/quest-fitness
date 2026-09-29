import { SetModifier } from '@prisma/client';
import { SetModifierDto } from './dto/set-modifier.dto';

export function toSetModifierDto(row: SetModifier): SetModifierDto {
  return {
    id: row.id,
    name: row.name,
    colorToken: row.colorToken,
    isPreset: row.isPreset,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
