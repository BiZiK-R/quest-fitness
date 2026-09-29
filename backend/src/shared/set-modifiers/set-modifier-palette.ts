export type SetModifierPaletteEntry = {
  id: string;
  hex: string;
};

/** Fixed palette (UX-DR22): tokens only — no client-supplied hex. Contrast ≥3:1 vs #1b1416. */
export const SET_MODIFIER_PALETTE: readonly SetModifierPaletteEntry[] = [
  { id: 'mod-amber', hex: '#FBBF24' },
  { id: 'mod-sky', hex: '#7DD3FC' },
  { id: 'mod-rose', hex: '#FDA4AF' },
  { id: 'mod-lime', hex: '#BEF264' },
  { id: 'mod-violet', hex: '#C4B5FD' },
  { id: 'mod-teal', hex: '#5EEAD4' },
  { id: 'mod-orange', hex: '#FDBA74' },
  { id: 'mod-fuchsia', hex: '#F0ABFC' },
] as const;

const SURFACE_SESSION_SUNKEN = '#1b1416';

function srgbChannel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (
    0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b)
  );
}

function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isKnownSetModifierColorToken(token: string): boolean {
  return SET_MODIFIER_PALETTE.some((entry) => entry.id === token);
}

export function hexForSetModifierColorToken(token: string): string | null {
  return SET_MODIFIER_PALETTE.find((entry) => entry.id === token)?.hex ?? null;
}

/** @internal exported for palette contrast tests */
export function paletteContrastOnSessionSunken(hex: string): number {
  return contrastRatio(hex, SURFACE_SESSION_SUNKEN);
}
