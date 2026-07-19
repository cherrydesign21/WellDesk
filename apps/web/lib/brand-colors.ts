const HEX_RE = /^#?([0-9a-f]{6})$/i;

function hexToRgb(hex: string) {
  const match = HEX_RE.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return rgbToHexString(v, v, v);
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hueToRgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const r = Math.round(hueToRgb(h + 1 / 3) * 255);
  const g = Math.round(hueToRgb(h) * 255);
  const b = Math.round(hueToRgb(h - 1 / 3) * 255);
  return rgbToHexString(r, g, b);
}

function rgbToHexString(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function relativeLuminance(r: number, g: number, b: number) {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(l1: number, l2: number) {
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Picks black or white — whichever reads better against the given hex background. */
export function pickReadableForeground(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const bgLum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  const whiteContrast = contrastRatio(1, bgLum);
  const blackContrast = contrastRatio(bgLum, 0);
  return whiteContrast >= blackContrast ? '#ffffff' : '#000000';
}

const RAMP_LIGHTNESS: Record<string, number> = {
  '50': 0.97,
  '100': 0.93,
  '200': 0.87,
  '300': 0.78,
  '400': 0.68,
  '500': 0.58,
  '600': 0.5,
  '700': 0.42,
  '800': 0.35,
  '900': 0.27,
};

const RAMP_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

/**
 * Builds a full 50-900 shade ramp from one brand hex color (same steps the
 * static design tokens use), plus a contrast-checked foreground for the
 * "600" shade — the one used as solid button/active-nav backgrounds.
 */
export function buildBrandColorVars(hex: string | null | undefined): Record<string, string> | null {
  if (!hex) return null;
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  // very unsaturated (near-grey) picks read as broken/washed out — keep a floor.
  const usableSaturation = Math.max(s, 0.35);

  const vars: Record<string, string> = {};
  for (const step of RAMP_STEPS) {
    vars[`--primary-${step}`] = hslToHex(h, usableSaturation, RAMP_LIGHTNESS[step]);
  }
  vars['--primary-foreground'] = pickReadableForeground(vars['--primary-600']);
  vars['--sidebar-primary-foreground'] = vars['--primary-foreground'];
  return vars;
}
