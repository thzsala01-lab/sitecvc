const root = document.querySelector("[data-house]");
if (root) {
  import("./three/house-view.js")
    .then(({ mountHouse }) => mountHouse(root))
    .catch((error) => {
      root.dataset.housePhase = "unavailable";
      root.querySelector("[data-house-status]").textContent =
        "A visita 3D não está disponível neste navegador. Continue pelo catálogo e pelas páginas do site.";
      root.querySelector("[data-house-canvas]").replaceChildren();
      root
        .querySelectorAll("[data-house-enter],[data-house-pause]")
        .forEach((button) => (button.hidden = true));
      console.warn("Visita 3D indisponível:", error.message);
    });
}
