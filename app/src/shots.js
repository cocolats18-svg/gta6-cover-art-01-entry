// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone. `photo` picks the samples
// (samples/<photo>.jpg) and `caption` the words. window.__shotReady is set
// once painted, so a headless browser knows when to shoot.
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout') || 'strip';
  const mode = query.get('mode') || 'each';
  const caption = query.get('caption') || 'VICE CITY NIGHTS';
  const sub = query.get('sub') || 'Sunset Heist';
  const first = query.get('photo') || 'pier';
  const second = query.get('photo2') || 'boulevard';
  await setup({
    layout,
    mode,
    caption,
    subcaption: sub,
    first: `samples/${first}.jpg`,
    second: `samples/${second}.jpg`,
    third: `samples/${first}.jpg`,
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
