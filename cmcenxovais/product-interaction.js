/** Optional perspective of the original photo, with no invented reverse view. */
export function initProductInteraction(root, onInteraction) {
  const host = root.querySelector(".studio-photo-host");
  const toggle = root.querySelector("[data-perspective-toggle]");
  const drawers = root.querySelector("[data-drawer-toggle]");
  const hint = root.querySelector("[data-perspective-hint]");
  let mode = false,
    dragging = false,
    start,
    yaw = 0,
    pitch = 0;
  const frame = () =>
    host.querySelector(".fryer-motion-frame") ||
    host.querySelector("[data-real-product-photo]");
  function apply() {
    const target = frame();
    if (target)
      target.style.transform = mode
        ? `perspective(1000px) rotateX(${pitch}deg) rotateY(${yaw}deg)`
        : "";
  }
  function showMode(next) {
    mode = next;
    dragging = false;
    yaw = pitch = 0;
    root.dataset.perspective = String(mode);
    toggle.setAttribute("aria-pressed", String(mode));
    toggle.textContent = mode
      ? "Voltar à foto"
      : "Modo 3D · foto em perspectiva";
    host.tabIndex = mode ? 0 : -1;
    host.setAttribute("role", mode ? "group" : "img");
    host.setAttribute(
      "aria-label",
      mode
        ? "Foto em perspectiva. Arraste ou use as setas. Ângulo limitado à foto original."
        : "Foto original do produto",
    );
    hint.textContent = mode
      ? "Foto em perspectiva · arraste ou use as setas. Não é um modelo 360°."
      : "";
    apply();
    onInteraction();
  }
  toggle.addEventListener("click", () => showMode(!mode));
  host.addEventListener("pointerdown", (e) => {
    if (!mode || e.button !== 0) return;
    host.getAnimations({ subtree: true }).forEach((a) => a.finish());
    dragging = true;
    start = { x: e.clientX, y: e.clientY, yaw, pitch };
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    yaw = Math.max(-18, Math.min(18, start.yaw + (e.clientX - start.x) * 0.12));
    pitch = Math.max(
      -10,
      Math.min(10, start.pitch - (e.clientY - start.y) * 0.09),
    );
    apply();
  });
  const stop = () => {
    dragging = false;
  };
  host.addEventListener("pointerup", stop);
  host.addEventListener("pointercancel", stop);
  host.addEventListener("keydown", (e) => {
    if (!mode) return;
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "Escape",
      ].includes(e.key)
    )
      return;
    e.preventDefault();
    if (e.key === "Escape") {
      showMode(false);
      toggle.focus();
      return;
    }
    if (e.key === "Home") yaw = pitch = 0;
    if (e.key === "ArrowLeft") yaw = Math.max(-18, yaw - 3);
    if (e.key === "ArrowRight") yaw = Math.min(18, yaw + 3);
    if (e.key === "ArrowUp") pitch = Math.max(-10, pitch - 3);
    if (e.key === "ArrowDown") pitch = Math.min(10, pitch + 3);
    apply();
  });
  drawers.addEventListener("click", () => {
    host.getAnimations({ subtree: true }).forEach((a) => a.finish());
    let container = host.querySelector(".fryer-motion-frame");
    if (!container) {
      const photo = host.querySelector("[data-real-product-photo]");
      container = document.createElement("div");
      container.className = "fryer-motion-frame";
      host.replaceChildren(container);
      container.append(photo);
      for (const side of ["left", "right"]) {
        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = "";
        img.draggable = false;
        img.setAttribute("aria-hidden", "true");
        img.className = "fryer-drawer fryer-drawer--" + side;
        container.append(img);
      }
      root.dataset.drawers = "open";
      apply();
    }
    const closed = root.dataset.drawers !== "closed";
    root.dataset.drawers = closed ? "closed" : "open";
    drawers.setAttribute("aria-pressed", String(closed));
    drawers.textContent = closed ? "Abrir gavetas" : "Fechar gavetas";
    hint.textContent = "Movimento ilustrativo com recortes da foto original.";
    onInteraction();
  });
  return {
    reset(index) {
      delete root.dataset.drawers;
      drawers.hidden = index !== 2;
      drawers.textContent = "Fechar gavetas";
      drawers.setAttribute("aria-pressed", "false");
      showMode(false);
    },
  };
}
