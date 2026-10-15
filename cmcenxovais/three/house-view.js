import { THREE } from "./geometry.js";
import { createStage } from "./runtime.js";
import {
  createHouse,
  sampleTour,
  sampleRoomEntry,
  TOUR_DURATION,
} from "./house-model.js";
export function mountHouse(root) {
  const host = root.querySelector("[data-house-canvas]");
  const stage = createStage(host, { background: "#cbd9dc" });
  const { scene, camera, renderer, mobile } = stage;
  scene.fog = new THREE.Fog("#cbd9dc", 23, 48);
  camera.fov = 52;
  camera.updateProjectionMatrix();
  const house = createHouse();
  scene.add(house.group);
  scene.add(new THREE.HemisphereLight("#fff5df", "#969a87", 2.1));
  const sun = new THREE.DirectionalLight("#fff1d5", 3);
  sun.position.set(8, 14, 13);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(mobile ? 512 : 1024);
  Object.assign(sun.shadow.camera, {
    left: -15,
    right: 15,
    top: 15,
    bottom: -15,
    near: 1,
    far: 45,
  });
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  for (const z of [4, -2, -6, -12.5]) {
    const light = new THREE.PointLight("#ffe4b5", 12, 7, 2);
    light.position.set(0, 2.95, z);
    scene.add(light);
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const enter = root.querySelector("[data-house-enter]"),
    pause = root.querySelector("[data-house-pause]"),
    replay = root.querySelector("[data-house-replay]"),
    status = root.querySelector("[data-house-status]");
  let phase = "tour",
    elapsed = 0,
    openingTime = 0,
    paused = false,
    visible = true,
    last = 0,
    frame = 0,
    lastDraw = 0;
  function setPhase(next) {
    phase = next;
    root.dataset.housePhase = next;
    enter.hidden = next !== "waiting";
    replay.hidden = next !== "entered";
    pause.hidden = next === "waiting" || next === "entered";
    status.textContent = {
      tour: "Entremos na sua próxima inspiração.",
      waiting: "O quarto está logo ali. Abra a porta para descobrir.",
      opening: "Bem-vindo ao seu momento de conforto.",
      entered: "Sinta-se em casa. Explore os produtos abaixo.",
    }[next];
  }
  function pose() {
    if (phase === "tour") {
      const sample = sampleTour(elapsed);
      camera.position.fromArray(sample.position);
      camera.lookAt(...sample.target);
    } else if (phase === "waiting") {
      const sample = sampleTour(TOUR_DURATION);
      camera.position.fromArray(sample.position);
      camera.lookAt(...sample.target);
    } else {
      house.openDoor(openingTime / 1.8);
      const sample = sampleRoomEntry(openingTime);
      camera.position.fromArray(sample.position);
      camera.lookAt(...sample.target);
    }
    host.dataset.cameraZ = camera.position.z.toFixed(2);
    host.dataset.doorAngle = house.doorPivot.rotation.y.toFixed(3);
    stage.draw();
  }
  function active() {
    return (
      visible &&
      !document.hidden &&
      !paused &&
      (phase === "tour" || phase === "opening")
    );
  }
  function tick(now) {
    frame = 0;
    if (!active()) return;
    if (last) {
      const dt = (now - last) / 1000;
      if (phase === "tour") {
        elapsed = Math.min(TOUR_DURATION, elapsed + dt);
        if (elapsed >= TOUR_DURATION) setPhase("waiting");
      } else {
        openingTime = Math.min(5, openingTime + dt);
        if (openingTime >= 5) setPhase("entered");
      }
    }
    last = now;
    if (
      now - lastDraw > (stage.software ? 65 : mobile ? 33 : 22) ||
      !active()
    ) {
      pose();
      lastDraw = now;
    }
    if (active()) frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    root.dataset.houseMotion = paused ? "paused" : "playing";
    if (active()) frame = requestAnimationFrame(tick);
    else pose();
  }
  function open() {
    if (phase !== "waiting") return;
    setPhase("opening");
    openingTime = 0;
    if (reduced.matches) {
      openingTime = 5;
      setPhase("entered");
    }
    schedule();
  }
  enter.addEventListener("click", open);
  // The closed door itself is clickable, alongside the keyboard-accessible button.
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  renderer.domElement.addEventListener("click", (event) => {
    if (phase !== "waiting") return;
    const r = host.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    if (ray.intersectObject(house.doorPivot, true).length) open();
  });
  pause.addEventListener("click", () => {
    paused = !paused;
    pause.setAttribute("aria-pressed", String(paused));
    pause.textContent = paused ? "Continuar visita" : "Pausar visita";
    schedule();
  });
  replay.addEventListener("click", () => {
    elapsed = 0;
    openingTime = 0;
    paused = false;
    house.openDoor(0);
    setPhase(reduced.matches ? "waiting" : "tour");
    schedule();
  });
  reduced.addEventListener("change", () => {
    if (reduced.matches && phase === "tour") {
      elapsed = TOUR_DURATION;
      setPhase("waiting");
    } else if (reduced.matches && phase === "opening") {
      openingTime = 5;
      setPhase("entered");
    }
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      schedule();
    },
    { threshold: 0.02 },
  );
  observer.observe(root);
  host.addEventListener("three-resize", () => {
    pose();
  });
  host.addEventListener("three-unavailable", () => {
    cancelAnimationFrame(frame);
    root.dataset.housePhase = "unavailable";
    status.textContent =
      "A visita 3D foi interrompida. Você pode continuar explorando o site.";
    enter.hidden = pause.hidden = replay.hidden = true;
  });
  setPhase(reduced.matches ? "waiting" : "tour");
  root.dataset.houseReady = "true";
  pose();
  schedule();
  return {
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      stage.dispose();
    },
  };
}
