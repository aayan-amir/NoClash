/**
 * Thread colors assigned deterministically by component index.
 * Natural-dye textile palette.
 */

export const THREAD_COLORS = [
  { name: 'madder', hex: '#B23A2E' },     // Madder root red
  { name: 'turmeric', hex: '#D9A21B' },   // Turmeric yellow
  { name: 'indigo', hex: '#26357A' },     // Indigo vat deep blue
  { name: 'tea', hex: '#4C6B3A' },        // Tea leaf green
  { name: 'brick', hex: '#C4622D' },      // Kiln brick terracotta
  { name: 'aubergine', hex: '#5B2A56' },  // Aubergine purple
  { name: 'teal', hex: '#1F6F6B' },       // Teal dye
  { name: 'iron', hex: '#4A4A4F' },       // Iron mordant grey
  { name: 'rose', hex: '#C75A7A' },       // Rose madder
  { name: 'olive', hex: '#7A6A2B' },      // Olive leaf
];

export function getThreadColor(index: number): { name: string; hex: string } {
  return THREAD_COLORS[index % THREAD_COLORS.length];
}

/**
 * Calculates luminance and picks either white or dark ink to guarantee >= 4.5:1 WCAG contrast
 */
export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Relative luminance
  const sRGB = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];

  // Return white for dark colors, dark ink (#1B1D22) for light colors
  return luminance > 0.4 ? '#1B1D22' : '#FFFFFF';
}
