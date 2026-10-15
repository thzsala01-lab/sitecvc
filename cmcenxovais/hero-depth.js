const hero = document.querySelector('.hero');
const control = hero?.querySelector('[data-hero-motion]');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
let visible = true;
let frame = 0;
let x = 0;
let y = 0;
function sync() {
  if (!hero || !control) return;
  hero.dataset.motion = paused || !visible || document.hidden ? 'paused' : 'playing';
  control.textContent = paused ? 'Ativar movimento' : 'Pausar movimento';
  control.setAttribute('aria-pressed', String(paused));
  if (paused) {
    hero.style.setProperty('--hero-x', '0px');
    hero.style.setProperty('--hero-y', '0px');
  }
}
function update() {
  frame = 0;
  if (paused || !visible || document.hidden) return;
  hero.style.setProperty('--hero-x', `${x.toFixed(2)}px`);
  hero.style.setProperty('--hero-y', `${y.toFixed(2)}px`);
}
hero?.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || paused || preference.matches) return;
  const bounds = hero.getBoundingClientRect();
  x = ((event.clientX - bounds.left) / bounds.width - .5) * 6;
  y = ((event.clientY - bounds.top) / bounds.height - .5) * 4;
  if (!frame) frame = requestAnimationFrame(update);
});
hero?.addEventListener('pointerleave', () => {
  x = y = 0;
  if (!frame) frame = requestAnimationFrame(update);
});
control?.addEventListener('click', () => {
  paused = !paused;
  sync();
});
preference.addEventListener('change', () => { paused = preference.matches; sync(); });
document.addEventListener('visibilitychange', sync);
if (hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(hero);
}
sync();
