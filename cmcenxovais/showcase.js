const root = document.querySelector(".product-studio");
const products = [
  {
    key: "glass",
    name: "Taça",
    category: "Mesa & encontros",
    title: "Cada detalhe, <br>um novo ângulo.",
    description: "Explore o volume e os relevos da taça âmbar.",
    cta: "Consultar taças",
    bg: "#edcdb3",
    ink: "#4e3028",
    interest: "taças",
    note: "Reconstrução visual baseada na foto; proporções aproximadas.",
  },
  {
    key: "kettle",
    name: "Chaleira",
    category: "Cozinha & rituais",
    title: "Do preparo <br>ao primeiro gole.",
    description:
      "Veja a chaleira inclinar e servir água em um copo liso, com líquido em 3D.",
    cta: "Consultar chaleiras",
    bg: "#cdd9d5",
    ink: "#293f39",
    interest: "chaleiras",
    note: "Modelo baseado na referência BE.SMART. O copo é auxiliar; a taça não recebe água.",
  },
  {
    key: "fryer",
    name: "Air Fryer",
    category: "Praticidade & sabor",
    title: "Abra novas <br>possibilidades.",
    description: "Gire o produto e acompanhe o movimento das duas gavetas.",
    cta: "Consultar air fryers",
    bg: "#d0c6df",
    ink: "#3d3055",
    interest: "air fryers",
    note: "Reconstrução das formas visíveis na foto; interiores simplificados, sem especificações técnicas.",
  },
  {
    key: "cushion",
    name: "Almofada",
    category: "Texturas & aconchego",
    title: "Conforto que <br>ganha forma.",
    description:
      "Uma deformação suave da malha demonstra a maciez da almofada.",
    cta: "Consultar almofadas",
    bg: "#c6d9e9",
    ink: "#263c53",
    interest: "almofadas",
    note: "Estampa da referência sobre malha 3D; costas e medidas não verificadas. A deformação é demonstrativa.",
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
  viewer = null,
  loading = null,
  view = "photo";
const host = root.querySelector(".studio-canvas"),
  photoHost = root.querySelector(".studio-photo-host"),
  photo = root.querySelector("[data-real-product-photo]");
const demo = root.querySelector("[data-product-demo]"),
  pause = root.querySelector("[data-studio-motion]"),
  demoBar = root.querySelector(".studio-demo-bar");
const photoButton = root.querySelector("[data-view-photo]"),
  modelButton = root.querySelector("[data-view-model]");
function state(value) {
  root.dataset.demoState = value;
  demo.disabled = !viewer || value === "none";
  pause.disabled = !viewer || value === "none" || value === "finished";
  demo.textContent =
    value === "playing" ? "Reiniciar demonstração" : "Repetir demonstração";
  pause.textContent =
    root.dataset.motion === "paused" ? "Continuar animação" : "Pausar animação";
  pause.setAttribute("aria-pressed", String(root.dataset.motion === "paused"));
  root.querySelector("[data-demo-status]").textContent =
    {
      playing: "Demonstração aproximada em movimento",
      paused: "Animação pausada",
      finished: "Demonstração concluída.",
      none: "Gire para explorar a reconstrução 3D.",
    }[value] || "";
}
function copy() {
  const p = products[selected],
    real = photos[selected],
    isPhoto = view === "photo";
  root.querySelector("#studio-title").innerHTML = isPhoto
    ? real.title
    : p.title;
  root.querySelector("[data-studio-description]").textContent = isPhoto
    ? real.description
    : p.description;
  root.querySelector("[data-model-note]").textContent = isPhoto
    ? "Foto original do produto enviado."
    : p.note;
  root.querySelector("[data-studio-hint]").textContent = isPhoto
    ? "Foto original · detalhes reais do produto"
    : "Modelo aproximado · arraste para girar";
}
function showModel() {
  if (view !== "3d" || !viewer) return;
  const p = products[selected];
  viewer.setEnabled(true);
  viewer.select(p.key, p.bg);
}
function ensureViewer() {
  if (loading) return loading;
  root.dataset.viewerState = "loading";
  loading = import("./three/product-view.js")
    .then(({ mountProductViewer }) => {
      viewer = mountProductViewer(root, { onDemoState: state });
      root.dataset.motion = matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "paused"
        : "playing";
      root.querySelector("[data-product-reset]").disabled = false;
      viewer.setEnabled(view === "3d");
      showModel();
    })
    .catch((error) => {
      root.dataset.viewerState = "unavailable";
      host.innerHTML =
        '<p class="viewer-unavailable">A demonstração 3D não está disponível neste navegador. Use “Foto do produto” para ver o item real.</p>';
      console.warn("Demonstração 3D indisponível:", error.message);
    });
  return loading;
}
function setView(next) {
  view = next;
  root.dataset.productView = view;
  photoHost.hidden = view !== "photo";
  host.hidden = view !== "3d";
  demoBar.hidden = view !== "3d";
  pause.hidden = view !== "3d";
  photoButton.setAttribute("aria-pressed", String(view === "photo"));
  modelButton.setAttribute("aria-pressed", String(view === "3d"));
  copy();
  if (view === "photo") viewer?.setEnabled(false);
  else if (viewer) showModel();
  else ensureViewer();
}
function select(index, user = false) {
  selected = (index + products.length) % products.length;
  const p = products[selected],
    real = photos[selected];
  root
    .querySelector(".studio-copy")
    .setAttribute("aria-live", user ? "polite" : "off");
  root.style.setProperty("--studio-bg", p.bg);
  root.style.setProperty("--studio-ink", p.ink);
  root.querySelector(".studio-word").textContent = p.name;
  root.querySelector("[data-studio-category]").textContent = p.category;
  root.dataset.activeProduct = String(selected);
  root.dataset.realPhotoReady = "false";
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
    .querySelectorAll("button[data-product]")
    .forEach((b, i) => b.setAttribute("aria-pressed", String(i === selected)));
  // Each product opens with its original photo. The 3D approximation requires opt-in.
  setView("photo");
}
photo.addEventListener("load", () => {
  root.dataset.realPhotoReady = "true";
});
photo.addEventListener("error", () => {
  root.dataset.realPhotoReady = "false";
  root.querySelector("[data-studio-hint]").textContent =
    "Não foi possível carregar a foto. Tente recarregar a página.";
});
root
  .querySelectorAll("button[data-product]")
  .forEach((b) =>
    b.addEventListener("click", () => select(Number(b.dataset.product), true)),
  );
root
  .querySelector("[data-studio-prev]")
  .addEventListener("click", () => select(selected - 1, true));
root
  .querySelector("[data-studio-next]")
  .addEventListener("click", () => select(selected + 1, true));
photoButton.addEventListener("click", () => setView("photo"));
modelButton.addEventListener("click", () => setView("3d"));
demo.addEventListener("click", () => viewer?.replay());
pause.addEventListener("click", () => viewer?.togglePause());
root
  .querySelector("[data-product-reset]")
  .addEventListener("click", () => viewer?.reset());
root.dataset.viewerState = "idle";
select(0);
