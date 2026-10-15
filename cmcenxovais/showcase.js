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
  {
    key: "towel",
    name: "Toalha",
    category: "Banho & cuidado",
    title: "Um cuidado <br>que se revela.",
    description:
      "Acompanhe o tecido se desenrolando e explore o volume da peça.",
    cta: "Explorar banho",
    bg: "#e0d9c9",
    ink: "#494139",
    interest: "toalhas",
    note: "Demonstração genérica de tecido. Não representa um modelo comercial nem medidas de catálogo.",
  },
];
let selected = 0,
  viewer = null,
  loading = null;
const host = root.querySelector(".studio-canvas"),
  demo = root.querySelector("[data-product-demo]"),
  pause = root.querySelector("[data-studio-motion]");
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
      playing: "Demonstração em movimento",
      paused: "Animação pausada",
      finished: "Demonstração concluída. Arraste para explorar.",
      none: "Arraste para explorar o produto em 360°.",
    }[value] || "";
}
function select(index, user = false) {
  selected = (index + products.length) % products.length;
  const p = products[selected];
  root
    .querySelector(".studio-copy")
    .setAttribute("aria-live", user ? "polite" : "off");
  root.style.setProperty("--studio-bg", p.bg);
  root.style.setProperty("--studio-ink", p.ink);
  root.querySelector(".studio-word").textContent = p.name;
  root.querySelector("[data-studio-category]").textContent = p.category;
  root.querySelector("#studio-title").innerHTML = p.title;
  root.querySelector("[data-studio-description]").textContent = p.description;
  root.querySelector("[data-model-note]").textContent = p.note;
  root.dataset.activeProduct = String(selected);
  const cta = root.querySelector("[data-studio-cta]");
  cta.firstChild.textContent = p.cta + " ";
  cta.href =
    p.key === "towel"
      ? "/catalogo"
      : "https://wa.me/5537988424250?text=" +
        encodeURIComponent(
          `Olá! Gostaria de conhecer os modelos disponíveis de ${p.interest} da CMC Enxovais.`,
        );
  root
    .querySelectorAll("button[data-product]")
    .forEach((b, i) => b.setAttribute("aria-pressed", String(i === selected)));
  if (viewer) viewer.select(p.key, p.bg);
  else ensureViewer();
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
      select(selected);
      root.querySelector("[data-product-reset]").disabled = false;
    })
    .catch((error) => {
      root.dataset.viewerState = "unavailable";
      host.innerHTML =
        '<p class="viewer-unavailable">O 3D não está disponível neste navegador. Você pode continuar pelo catálogo ou consultar nossa equipe.</p>';
      root.querySelector("[data-studio-hint]").textContent =
        "Consulte o catálogo para ver os produtos.";
      console.warn("Visualizador 3D indisponível:", error.message);
    });
  return loading;
}
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
demo.addEventListener("click", () => viewer?.replay());
pause.addEventListener("click", () => viewer?.togglePause());
root
  .querySelector("[data-product-reset]")
  .addEventListener("click", () => viewer?.reset());
// Keep the 3D product code off the initial request until the section approaches.
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        ensureViewer();
        observer.disconnect();
      }
    },
    { threshold: 0.05 },
  );
  observer.observe(root);
} else ensureViewer();
// Set initial copy without starting the lazy import.
root.querySelector("[data-model-note]").textContent = products[0].note;
