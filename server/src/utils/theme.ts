import sharp from 'sharp';
import type { PosterTheme } from '../types/poster-theme.js';

export async function extractPosterTheme(
  posterUrl: string,
): Promise<PosterTheme> {
  try {
    if (!posterUrl) return { hue: null, saturation: null, lightness: null };

    const response = await fetch(posterUrl);
    if (!response.ok) throw new Error('Failed to download image');

    const arrayBuffer = response.ok ? await response.arrayBuffer() : null;
    if (!arrayBuffer) throw new Error('Empty buffer');
    const buffer = Buffer.from(arrayBuffer);

    const { data } = await sharp(buffer)
      .resize(50, 75, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colorMap = new Map<string, { count: number; totalL: number }>();

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const rN = r / 255,
        gN = g / 255,
        bN = b / 255;
      const max = Math.max(rN, gN, bN);
      const min = Math.min(rN, gN, bN);
      const l = (max + min) / 2;
      const d = max - min;
      const s =
        max === min ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (l < 0.1 || l > 0.9 || s < 0.15) continue;

      let h = 0;
      if (d !== 0) {
        switch (max) {
          case rN:
            h = (gN - bN) / d + (gN < bN ? 6 : 0);
            break;
          case gN:
            h = (bN - rN) / d + 2;
            break;
          case bN:
            h = (rN - gN) / d + 4;
            break;
        }
        h /= 6;
      }

      const hue = Math.round(h * 360);
      const sat = Math.round(s * 100);
      const key = `${Math.round(hue / 10) * 10}-${Math.round(sat / 10) * 10}`;

      const existing = colorMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalL += l;
      } else {
        colorMap.set(key, { count: 1, totalL: l });
      }
    }

    const dominant = [...colorMap.entries()].sort(
      (a, b) => b[1].count - a[1].count,
    )[0];

    if (!dominant) return { hue: null, saturation: null, lightness: null };

    const [hue, saturationPercentage] = dominant[0].split('-').map(Number);
    const lightnessPercentage = Math.round(
      (dominant[1].totalL / dominant[1].count) * 100,
    );

    return {
      hue,
      saturation: `${saturationPercentage}%`,
      lightness: `${lightnessPercentage}%`,
    };
  } catch (error: unknown) {
    console.error('[Theme Extractor] Failed, using null fallbacks:', error);
    return { hue: null, saturation: null, lightness: null };
  }
}
