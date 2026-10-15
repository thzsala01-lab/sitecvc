const hero = document.querySelector(".hero");
hero.dataset.introLoading = "true";
const image = hero.querySelector(".hero__mobile-image");
const button = hero.querySelector("[data-hero-motion]");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let cancelled = Boolean(location.hash) || scrollY > 20,
  timer,
  ready = false;
function cancel() {
  cancelled = true;
  clearTimeout(timer);
}
function schedule() {
  clearTimeout(timer);
  if (ready && !cancelled && !document.hidden)
    timer = setTimeout(() => {
      cancelled = true;
      document
        .querySelector("#experiencia-3d")
        .scrollIntoView({
          behavior: reduced.matches ? "instant" : "smooth",
          block: "start",
        });
      hero.dataset.introComplete = "true";
    }, 5000);
}
for (const event of ["wheel", "touchstart", "keydown"])
  window.addEventListener(event, cancel, { passive: true, once: true });
document.addEventListener("click", (e) => {
  if (e.target.closest("a, button, input")) cancel();
});
window.addEventListener(
  "scroll",
  () => {
    if (scrollY > 30 && !hero.dataset.introComplete) cancel();
  },
  { passive: true },
);
document.addEventListener("visibilitychange", schedule);
function motion(paused) {
  hero.dataset.motion = paused ? "paused" : "playing";
  button.setAttribute("aria-pressed", String(paused));
  button.textContent = paused ? "Continuar movimento" : "Pausar movimento";
}
button.addEventListener("click", () =>
  motion(hero.dataset.motion !== "paused"),
);
reduced.addEventListener("change", () => motion(reduced.matches));
motion(reduced.matches);
image
  .decode()
  .then(() => {
    ready = true;
    hero.dataset.introLoading = "false";
    hero.classList.add("hero-ready");
    schedule();
  })
  .catch(() => {
    hero.dataset.introLoading = "false";
    cancel();
  });
