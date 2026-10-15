const products = [
  {
    name: "Taça",
    category: "Mesa & encontros",
    cta: "Consultar taças",
    bg: "#edcdb3",
    ink: "#4e3028",
    interest: "taças",
  },
  {
    name: "Chaleira",
    category: "Cozinha & rituais",
    cta: "Consultar chaleiras",
    bg: "#cdd9d5",
    ink: "#293f39",
    interest: "chaleiras",
  },
  {
    name: "Air Fryer",
    category: "Praticidade & sabor",
    cta: "Consultar air fryers",
    bg: "#d0c6df",
    ink: "#3d3055",
    interest: "air fryers",
  },
  {
    name: "Almofada",
    category: "Texturas & aconchego",
    cta: "Consultar almofadas",
    bg: "#c6d9e9",
    ink: "#263c53",
    interest: "almofadas",
  },
];
const photos = [
  {
    file: "taca.png",
    alt: "Taça âmbar facetada original enviada",
    title: "Um brinde aos <br>bons momentos.",
    description:
      "A taça âmbar que você escolheu, com seus relevos e detalhes originais.",
  },
  {
    file: "chaleira.png",
    alt: "Chaleira elétrica de vidro BE.SMART original enviada",
    title: "Uma pausa. <br>Um novo ritual.",
    description:
      "Chaleira BE.SMART de vidro, com a aparência original do produto enviado.",
  },
  {
    file: "air-fryer.png",
    alt: "Air fryer BE.SMART original de duas gavetas com alimentos",
    title: "Mais sabor. <br>Mais praticidade.",
    description:
      "A air fryer BE.SMART de duas gavetas, exatamente como na foto enviada.",
  },
  {
    file: "almofadas.png",
    alt: "Par de almofadas azuis originais com estampa esportiva",
    title: "Seu cantinho. <br>Sua personalidade.",
    description:
      "As almofadas azuis com a estampa esportiva original que você enviou.",
  },
];
let selected = 0,
  timer,
  visible = false;
const root = document.querySelector(".product-studio");
const photo = root.querySelector("[data-real-product-photo]");
const pause = root.querySelector("[data-studio-motion]");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reduced.matches;
function schedule() {
  clearTimeout(timer);
  if (!paused && visible && !document.hidden)
    timer = setTimeout(() => select(selected + 1), 5000);
}
function select(index, user = false) {
  selected = (index + products.length) % products.length;
  const p = products[selected],
    real = photos[selected];
  root.dataset.activeProduct = String(selected);
  root.style.setProperty("--studio-bg", p.bg);
  root.style.setProperty("--studio-ink", p.ink);
  root.querySelector(".studio-word").textContent = p.name;
  root.querySelector("[data-studio-category]").textContent = p.category;
  const copy = root.querySelector(".studio-copy");
  copy.setAttribute("aria-live", user ? "polite" : "off");
  root.querySelector("#studio-title").innerHTML = real.title;
  root.querySelector("[data-studio-description]").textContent =
    real.description;
  photo.alt = real.alt;
  photo.src = "/assets/products/" + real.file;
  const cta = root.querySelector("[data-studio-cta]");
  cta.firstChild.textContent = p.cta + " ";
  cta.href =
    "https://wa.me/5537988424250?text=" +
    encodeURIComponent(
      `Olá! Gostaria de conhecer os modelos disponíveis de ${p.interest} da CMC Enxovais.`,
    );
  root
    .querySelectorAll("[data-product]")
    .forEach((b, i) => b.setAttribute("aria-pressed", String(i === selected)));
  if (!reduced.matches) {
    photo.getAnimations().forEach((a) => a.cancel());
    photo.animate(
      [
        { opacity: 0, transform: "translateY(14px) scale(.97)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 700, easing: "ease-out" },
    );
    copy.getAnimations().forEach((a) => a.cancel());
    copy.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 550, easing: "ease-out" },
    );
  }
  schedule();
}
function updatePause() {
  pause.setAttribute("aria-pressed", String(paused));
  pause.textContent = paused
    ? "Continuar troca automática"
    : "Pausar troca automática";
  schedule();
}
pause.addEventListener("click", () => {
  paused = !paused;
  updatePause();
});
reduced.addEventListener("change", () => {
  paused = reduced.matches;
  updatePause();
});
root
  .querySelectorAll("[data-product]")
  .forEach((b) =>
    b.addEventListener("click", () => select(Number(b.dataset.product), true)),
  );
root
  .querySelector("[data-studio-prev]")
  .addEventListener("click", () => select(selected - 1, true));
root
  .querySelector("[data-studio-next]")
  .addEventListener("click", () => select(selected + 1, true));
document.addEventListener("visibilitychange", schedule);
new IntersectionObserver(
  (entries) => {
    visible = entries[0].isIntersecting;
    schedule();
  },
  { threshold: 0.35 },
).observe(root);
photo.addEventListener("error", () => {
  root.querySelector("[data-studio-hint]").textContent =
    "Não foi possível carregar a foto. Tente recarregar a página.";
});
photos.slice(1).forEach((p) => {
  const img = new Image();
  img.src = "/assets/products/" + p.file;
});
select(0);
updatePause();
