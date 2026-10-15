import { createProductScene, verifyProductPhotos } from './product-scenes.js';
import './product-scenes.css';

const root = document.querySelector('.product-studio');
const host = root.querySelector('.studio-canvas');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const products = [
  { name: 'Taça', category: 'Mesa & encontros', title: 'Um brinde aos <br>bons momentos.', description: 'O brilho do âmbar e os detalhes que fazem cada encontro especial.', cta: 'Consultar taças', bg: '#edcdb3', ink: '#4e3028', interest: 'Taças', hint: 'Luz, textura e os detalhes da sua taça' },
  { name: 'Chaleira', category: 'Cozinha & rituais', title: 'Uma pausa. <br>Um novo ritual.', description: 'Do preparo ao primeiro gole, um convite para aproveitar o momento.', cta: 'Consultar chaleiras', bg: '#cdd9d5', ink: '#293f39', interest: 'Chaleiras', hint: 'Acompanhe o movimento de servir' },
  { name: 'Air Fryer', category: 'Praticidade & sabor', title: 'Mais sabor. <br>Mais tempo para você.', description: 'Duas gavetas e novas possibilidades para os seus momentos na cozinha.', cta: 'Consultar air fryers', bg: '#d0c6df', ink: '#3d3055', interest: 'Air fryers', hint: 'Veja as gavetas abrindo e fechando' },
  { name: 'Almofada', category: 'Texturas & aconchego', title: 'Seu cantinho. <br>Sua personalidade.', description: 'Cores e estampas que deixam a sua casa com a sua cara.', cta: 'Consultar almofadas', bg: '#c6d9e9', ink: '#263c53', interest: 'Almofadas', hint: 'Cor, volume e aconchego em cada detalhe' },
];
let selected = 0;
let paused = preference.matches;
let visible = false;
let dragging = false;
let pointerId = null;
let lastPointerX = 0;
let tiltX = 0;
let tiltY = 0;
let elapsed = 0;
let lastFrame = 0;
let frame = 0;
const motionButton = root.querySelector('[data-studio-motion]');
const buttons = [...root.querySelectorAll('[data-product]')];
const clamp = value => Math.max(-8, Math.min(8, value));

function syncMotion() {
  const stopped = paused || !visible || document.hidden;
  root.dataset.motion = stopped ? 'paused' : 'playing';
  for (const animation of host.getAnimations()) {
    if (animation.playState !== 'finished') stopped ? animation.finish() : animation.play();
  }
  motionButton.textContent = paused ? 'Ativar animação' : 'Pausar animação';
  motionButton.setAttribute('aria-pressed', String(paused));
  root.dataset.reducedMotion = String(preference.matches);
  cancelAnimationFrame(frame);
  frame = 0;
  lastFrame = 0;
  if (!paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
}
function tilt() {
  const scene = host.querySelector('.photo-scene');
  scene?.style.setProperty('--photo-x', `${tiltX}deg`);
  scene?.style.setProperty('--photo-y', `${tiltY}deg`);
}
function selectProduct(index, { userInitiated = false } = {}) {
  selected = (index + products.length) % products.length;
  const product = products[selected];
  root.querySelector('.studio-copy').setAttribute('aria-live', userInitiated ? 'polite' : 'off');
  root.dataset.activeProduct = String(selected);
  root.style.setProperty('--studio-bg', product.bg);
  root.style.setProperty('--studio-ink', product.ink);
  root.querySelector('.studio-word').textContent = product.name;
  root.querySelector('[data-studio-category]').textContent = product.category;
  root.querySelector('#studio-title').innerHTML = product.title;
  root.querySelector('[data-studio-description]').textContent = product.description;
  root.querySelector('[data-studio-hint]').textContent = product.hint;
  const cta = root.querySelector('[data-studio-cta]');
  cta.firstChild.textContent = product.cta + ' ';
  cta.href = 'https://wa.me/5537988424250?text=' + encodeURIComponent(`Olá! Gostaria de conhecer os modelos disponíveis de ${product.interest.toLowerCase()} da CMC Enxovais.`);
  host.setAttribute('aria-label', `Foto de ${product.name}. Use as setas esquerda e direita para explorar a perspectiva.`);
  buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
  const scene = createProductScene(selected);
  scene.querySelectorAll('img').forEach(image => {
    image.addEventListener('error', () => {
      root.dataset.photoError = 'true';
      root.querySelector('[data-studio-hint]').textContent = 'Não foi possível carregar a foto. Tente recarregar a página.';
    }, { once: true });
  });
  host.replaceChildren(scene);
  tiltX = tiltY = 0;
  elapsed = 0;
  // Animate the scene entrance without restarting the product's own demonstration.
  if (!paused && !preference.matches) {
    host.animate([{ opacity: 0, translate: '0 20px' }, { opacity: 1, translate: '0 0' }], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }
}
function tick(now) {
  if (lastFrame) elapsed += (now - lastFrame) / 1000;
  lastFrame = now;
  if (elapsed > 11 && !dragging && !root.matches(':hover') && !root.contains(document.activeElement)) selectProduct(selected + 1);
  frame = requestAnimationFrame(tick);
}
buttons.forEach(button => button.addEventListener('click', () => selectProduct(Number(button.dataset.product), { userInitiated: true })));
root.querySelector('[data-studio-prev]').addEventListener('click', () => selectProduct(selected - 1, { userInitiated: true }));
root.querySelector('[data-studio-next]').addEventListener('click', () => selectProduct(selected + 1, { userInitiated: true }));
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
preference.addEventListener('change', () => { paused = preference.matches; tiltX = tiltY = 0; tilt(); syncMotion(); });
document.addEventListener('visibilitychange', syncMotion);

host.addEventListener('pointerdown', event => {
  if (event.button !== 0 || preference.matches) return;
  dragging = true;
  pointerId = event.pointerId;
  lastPointerX = event.clientX;
});
host.addEventListener('pointermove', event => {
  if (preference.matches) return;
  if (dragging && event.pointerId === pointerId) {
    const delta = event.clientX - lastPointerX;
    if (Math.abs(delta) > 2 && !host.hasPointerCapture(event.pointerId)) host.setPointerCapture(event.pointerId);
    tiltY = clamp(tiltY + delta * .08);
    lastPointerX = event.clientX;
  } else if (event.pointerType === 'mouse' && !paused) {
    const bounds = host.getBoundingClientRect();
    tiltX = clamp((.5 - (event.clientY - bounds.top) / bounds.height) * 8);
    tiltY = clamp(((event.clientX - bounds.left) / bounds.width - .5) * 12);
  } else return;
  tilt();
});
function release() { dragging = false; pointerId = null; }
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) host.addEventListener(name, release);
host.addEventListener('pointerleave', () => { if (!dragging) { tiltX = tiltY = 0; tilt(); } });
host.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
  event.preventDefault();
  if (preference.matches) return;
  tiltY = event.key === 'Home' ? 0 : clamp(tiltY + (event.key === 'ArrowLeft' ? -2 : 2));
  tilt();
});
selectProduct(0);
syncMotion();
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !root.dataset.entered) {
      root.dataset.entered = 'true';
      if (!preference.matches) {
        root.classList.add('studio-arriving');
        host.animate([{ opacity: 0, translate: '0 32px', scale: '.96' }, { opacity: 1, translate: '0 0', scale: '1' }], { duration: 950, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    }
    syncMotion();
  }, { threshold: .08 }).observe(root);
} else { visible = true; syncMotion(); }
verifyProductPhotos().then(results => {
  root.dataset.photosReady = String(results.every(result => result.available));
});
