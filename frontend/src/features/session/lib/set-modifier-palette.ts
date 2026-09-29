export type SetModifierPaletteEntry = {
  id: string;
  hex: string;
};

/** Must match backend SET_MODIFIER_PALETTE tokens (no free hex). */
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

export function hexForSetModifierToken(token: string): string | undefined {
  return SET_MODIFIER_PALETTE.find((entry) => entry.id === token)?.hex;
}
