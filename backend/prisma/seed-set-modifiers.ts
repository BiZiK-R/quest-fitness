import type { PrismaClient } from '@prisma/client';
import { SET_MODIFIER_PALETTE } from '../src/shared/set-modifiers/set-modifier-palette';

const PRESET_MODIFIERS: Array<{ name: string; colorToken: string }> = [
  { name: 'Разминка', colorToken: 'mod-amber' },
  { name: 'Рабочий', colorToken: 'mod-sky' },
  { name: 'Дроп-сет', colorToken: 'mod-rose' },
  { name: 'Пирамида', colorToken: 'mod-lime' },
  { name: 'Максимум', colorToken: 'mod-violet' },
  { name: 'Техника', colorToken: 'mod-teal' },
];

/**
 * Seeds preset SetModifier rows (idempotent by name + isPreset).
 */
export async function seedSetModifiers(prisma: PrismaClient): Promise<void> {
  for (const preset of PRESET_MODIFIERS) {
    if (!SET_MODIFIER_PALETTE.some((p) => p.id === preset.colorToken)) {
      throw new Error(`Invalid palette token in seed: ${preset.colorToken}`);
    }
    const existing = await prisma.setModifier.findFirst({
      where: { name: preset.name, isPreset: true },
    });
    if (existing) {
      await prisma.setModifier.update({
        where: { id: existing.id },
        data: { colorToken: preset.colorToken },
      });
      continue;
    }
    await prisma.setModifier.create({
      data: {
        name: preset.name,
        colorToken: preset.colorToken,
        isPreset: true,
      },
    });
  }
}
