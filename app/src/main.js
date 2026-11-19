// Wires the Vice City cover maker: pick up to three of your own photos (local
// only, FileReader / object URLs, never uploaded), crop and position each,
// choose a multi-panel layout and a caption, and export a PNG in 1080x1080,
// 1080x1350 or 1920x1080. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js).
import { drawCover, freshState, LAYOUTS, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = freshState();

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function ensureFonts() {
  try {
    await document.fonts.load('bold 40px "DejaVu Sans"');
    await document.fonts.ready;
  } catch { /* system sans-serif is the fallback */ }
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state);
}

function redrawSoon() {
  ensureFonts().then(redraw);
  redraw();
}

function bindPhotoSlot(slot, inputId, sampleId) {
  const input = document.getElementById(inputId);
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.photos[slot] = await loadImage(URL.createObjectURL(file));
    document.getElementById(`photo${slot + 1}Name`).textContent = file.name;
    redrawSoon();
  });
  document.getElementById(sampleId).addEventListener('click', async () => {
    const sample = slot === 1 ? 'samples/boulevard.jpg' : 'samples/pier.jpg';
    state.photos[slot] = await loadImage(sample);
    document.getElementById(`photo${slot + 1}Name`).textContent = 'sample photo';
    redrawSoon();
  });
}

bindPhotoSlot(0, 'photoA', 'sampleA');
bindPhotoSlot(1, 'photoB', 'sampleB');
bindPhotoSlot(2, 'photoC', 'sampleC');

// Layout picker.
document.querySelectorAll('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
    redrawSoon();
  });
});

// One photo everywhere, or one photo per panel.
document.querySelectorAll('[name="mode"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.mode = radio.value;
    redrawSoon();
  });
});

// Which photo the crop sliders edit.
let cropSlot = 0;
document.getElementById('cropPhoto').addEventListener('change', (e) => {
  cropSlot = Number(e.target.value);
  syncCropSliders();
});
function syncCropSliders() {
  const crop = state.crops[cropSlot];
  document.getElementById('zoom').value = crop.zoom;
  document.getElementById('offsetX').value = crop.dx;
  document.getElementById('offsetY').value = crop.dy;
}
document.getElementById('zoom').addEventListener('input', (e) => { state.crops[cropSlot].zoom = Number(e.target.value); redrawSoon(); });
document.getElementById('offsetX').addEventListener('input', (e) => { state.crops[cropSlot].dx = Number(e.target.value); redrawSoon(); });
document.getElementById('offsetY').addEventListener('input', (e) => { state.crops[cropSlot].dy = Number(e.target.value); redrawSoon(); });

// Caption, sub-caption, colour and sunset grade.
document.getElementById('caption').addEventListener('input', (e) => { state.caption = e.target.value; redrawSoon(); });
document.getElementById('subcaption').addEventListener('input', (e) => { state.subcaption = e.target.value; redrawSoon(); });
document.querySelectorAll('[data-color]').forEach((sw) => {
  sw.addEventListener('click', () => {
    state.captionColor = sw.dataset.color;
    document.querySelectorAll('[data-color]').forEach((s) => s.classList.toggle('active', s === sw));
    redrawSoon();
  });
});
document.getElementById('grade').addEventListener('input', (e) => { state.grade = Number(e.target.value); redrawSoon(); });

// Export size, then export.
document.getElementById('exportSize').addEventListener('change', (e) => {
  state.size = e.target.value;
  redrawSoon();
});
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out, state);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved vice-city-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

// Load both built-in samples so the first paint already shows a cover.
async function loadSamples() {
  const [pier, boulevard] = await Promise.all([
    loadImage('samples/pier.jpg'),
    loadImage('samples/boulevard.jpg'),
  ]);
  state.photos[0] = pier;
  state.photos[1] = boulevard;
  state.photos[2] = pier;
  redrawSoon();
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (scene) => {
    state.layout = LAYOUTS[scene.layout] ? scene.layout : 'strip';
    state.mode = scene.mode;
    state.caption = scene.caption;
    state.subcaption = scene.subcaption;
    const [a, b, c] = await Promise.all([
      loadImage(scene.first), loadImage(scene.second), loadImage(scene.third),
    ]);
    state.photos = [a, b, c];
    // Keep the editor controls honest about the scene the shot set up.
    document.querySelectorAll('[data-layout]').forEach((btn) => btn.classList.toggle('active', btn.dataset.layout === state.layout));
    document.querySelectorAll('[name="mode"]').forEach((r) => { r.checked = r.value === state.mode; });
    redrawSoon();
  });
} else {
  loadSamples();
}
syncCropSliders();
redrawSoon();
