// Draws the multi-panel Vice City cover: panel layouts, per-photo crop and
// position, a sunset/neon colour grade, a neon sun, and bold caption lettering.
// Everything is drawn on canvas with the app's own code — no Rockstar logo,
// artwork, character or font is used anywhere in this file.

export const LAYOUTS = {
  strip: {
    label: 'Vice Strip',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ],
  },
  triple: {
    label: 'Triple Split',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
  hero: {
    label: 'Hero + Side',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
};

export const SIZES = {
  square: { label: '1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 x 1350', w: 1080, h: 1350 },
  wide: { label: '1920 x 1080', w: 1920, h: 1080 },
};

/** A fresh, empty editor state. Photos are Image objects or null. */
export function freshState() {
  return {
    layout: 'strip',
    size: 'square',
    mode: 'each', // 'each' = one photo per panel, 'one' = photo A in every panel
    photos: [null, null, null],
    crops: [
      { zoom: 1, dx: 0, dy: 0.2 },
      { zoom: 1, dx: 0, dy: 0.2 },
      { zoom: 1, dx: 0, dy: 0.2 },
    ],
    caption: 'VICE CITY NIGHTS',
    subcaption: 'Sunset Heist',
    captionColor: '#ff2e88',
    grade: 0.7,
  };
}

function drawPhotoInto(ctx, photo, rect, crop) {
  if (!photo) {
    // Empty panel: a neon dusk gradient so the poster still reads as art.
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#3b1d5e');
    g.addColorStop(0.55, '#c22a7a');
    g.addColorStop(1, '#ff7a3d');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (crop?.zoom ?? 1);
  const pw = iw * scale;
  const ph = ih * scale;
  // Clamp the pan so the photo can never slide off and expose the panel.
  const maxDx = Math.max(0, (pw - rect.w) / 2);
  const maxDy = Math.max(0, (ph - rect.h) / 2);
  const ox = Math.max(-maxDx, Math.min(maxDx, (crop?.dx ?? 0) * rect.w * 0.4));
  const oy = Math.max(-maxDy, Math.min(maxDy, (crop?.dy ?? 0) * rect.h * 0.4));
  const cx = rect.x + rect.w / 2 + ox;
  const cy = rect.y + rect.h / 2 + oy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

function drawSunsetGrade(ctx, w, h, strength) {
  if (strength <= 0) return;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgba(255, 122, 61, ${0.22 * strength})`);
  g.addColorStop(0.5, `rgba(255, 46, 136, ${0.16 * strength})`);
  g.addColorStop(1, `rgba(80, 20, 140, ${0.34 * strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Vignette: darken the edges so the caption pops.
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(10, 0, 30, ${0.45 * strength})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function drawNeonSun(ctx, w, h, layout) {
  const r = Math.min(w, h) * 0.11;
  // Sit the sun over sky, not over a face: in Hero + Side the big panel is
  // on the left and its faces sit centre-right, so the sun goes to the
  // top-left sky corner instead of the top-right.
  const cx = layout === 'hero' ? w * 0.14 : w * 0.82;
  const cy = layout === 'hero' ? h * 0.13 : h * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffe95e');
  g.addColorStop(0.55, '#ff7a3d');
  g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Retro slats cut across the lower half of the sun.
  ctx.fillStyle = 'rgba(20, 0, 40, 0.85)';
  for (let i = 0; i < 4; i++) {
    const y = cy + r * (0.05 + i * 0.22);
    ctx.fillRect(cx - r, y, r * 2, r * 0.06);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255, 233, 94, 0.9)';
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.beginPath();
  ctx.arc(cx, cy, r + w * 0.008, 0, Math.PI * 2);
  ctx.stroke();
}

function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `bold ${size}px "DejaVu Sans", sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `bold ${size}px "DejaVu Sans", sans-serif`;
  }
  return size;
}

function drawCaption(ctx, w, h, state) {
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subcaption || '').trim();
  const bandH = h * 0.2;
  const bandY = h - bandH;
  // Dark band behind the lettering so it reads over any photo.
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, 'rgba(12, 0, 28, 0)');
  band.addColorStop(0.35, 'rgba(12, 0, 28, 0.82)');
  band.addColorStop(1, 'rgba(12, 0, 28, 0.95)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);
  // Neon rule above the caption.
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(w * 0.05, bandY + h * 0.015, w * 0.9, Math.max(2, h * 0.004));
  if (sub) {
    const subSize = fitCaption(ctx, sub, w * 0.86, h * 0.038);
    ctx.font = `bold ${subSize}px "DejaVu Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe95e';
    ctx.fillText(sub.toUpperCase(), w / 2, bandY + h * 0.075);
  }
  if (!text) return;
  const size = fitCaption(ctx, text, w * 0.9, h * 0.085);
  ctx.font = `bold ${size}px "DejaVu Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const y = h - h * 0.045;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#12001e';
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, w / 2, y);
  ctx.fillStyle = state.captionColor || '#ff2e88';
  ctx.shadowColor = 'rgba(255, 46, 136, 0.8)';
  ctx.shadowBlur = size * 0.25;
  ctx.fillText(text, w / 2, y);
  ctx.shadowBlur = 0;
}

/**
 * Draws the whole cover onto `canvas` (any size) from `state`.
 * Panel photos follow state.mode: 'one' uses photos[0] everywhere,
 * 'each' uses photos[i] in panel i. Crops are per photo.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#12001e';
  ctx.fillRect(0, 0, w, h);
  const layout = LAYOUTS[state.layout] || LAYOUTS.strip;
  const gap = Math.max(3, Math.round(Math.min(w, h) * 0.008));
  for (let i = 0; i < layout.panels.length; i++) {
    const p = layout.panels[i];
    const rect = {
      x: p.x * w + (p.x > 0 ? gap / 2 : 0),
      y: p.y * h + (p.y > 0 ? gap / 2 : 0),
      w: p.w * w - (p.x > 0 ? gap / 2 : 0) - (p.x + p.w < 1 ? gap / 2 : 0),
      h: p.h * h - (p.y > 0 ? gap / 2 : 0) - (p.y + p.h < 1 ? gap / 2 : 0),
    };
    const photoIndex = state.mode === 'one' ? 0 : i;
    drawPhotoInto(ctx, state.photos[photoIndex], rect, state.crops[photoIndex]);
    // Neon panel edge: cyan on the hero panel, pink on the rest.
    ctx.strokeStyle = i === 0 ? 'rgba(0, 229, 255, 0.9)' : 'rgba(255, 46, 136, 0.75)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }
  drawNeonSun(ctx, w, h, state.layout);
  drawSunsetGrade(ctx, w, h, state.grade ?? 0.7);
  drawCaption(ctx, w, h, state);
}
