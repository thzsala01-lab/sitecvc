import { THREE, mesh, disposeTree } from "./geometry.js";
import { createStage, studioLights } from "./runtime.js";
import { createProductModel } from "./product-models.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export function mountProductViewer(root, { onDemoState = () => {} } = {}) {
  const host = root.querySelector(".studio-canvas");
  const stage = createStage(host, { background: "#edcdb3" });
  const { scene, camera, renderer, mobile } = stage;
  studioLights(scene, mobile);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.minDistance = 3.1;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minPolarAngle = 0.12;
  controls.rotateSpeed = 0.7;
  renderer.domElement.style.touchAction = "pan-y";
  const floor = mesh(
    scene,
    new THREE.CircleGeometry(12, 72),
    new THREE.ShadowMaterial({ color: "#38291f", opacity: 0.17 }),
    0,
    -1.36,
    0,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  let enabled = true,
    selectedKey = null,
    model = null,
    frame = 0,
    visible = false,
    paused = matchMedia("(prefers-reduced-motion: reduce)").matches,
    playing = false,
    time = 0,
    last = 0,
    disposed = false,
    lastDraw = 0;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  function queue() {
    if (enabled && !frame && visible && !document.hidden && !disposed)
      frame = requestAnimationFrame(tick);
  }
  function render() {
    if (!model) return;
    controls.update();
    stage.draw();
    const delta = camera.position.clone().sub(controls.target);
    host.dataset.orbit = new THREE.Spherical()
      .setFromVector3(delta)
      .theta.toFixed(3);
    host.dataset.demoTime = time.toFixed(3);
  }
  function tick(now) {
    frame = 0;
    if (!enabled || !visible || document.hidden || disposed) {
      last = 0;
      return;
    }
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    if (playing && !paused) {
      time = Math.min(model.duration, time + dt);
      model.update(time);
      if (time >= model.duration) {
        playing = false;
        onDemoState("finished");
      }
    }
    if (now - lastDraw > (stage.software ? 65 : mobile ? 32 : 22) || !playing) {
      render();
      lastDraw = now;
    }
    if (playing && !paused) queue();
    else last = 0;
  }
  function frameCamera() {
    if (!model) return;
    const key = selectedKey;
    const distance =
      { glass: 4.55, kettle: 6.35, fryer: 5.6, cushion: 4.45, towel: 5.25 }[
        key
      ] * Math.max(1, 1 / camera.aspect);
    const center = new THREE.Box3()
      .setFromObject(model.group)
      .getCenter(new THREE.Vector3());
    controls.target.copy(center);
    camera.position.copy(
      new THREE.Vector3(
        key === "towel" ? 2 : 2.2,
        key === "towel" ? 2.4 : 1.35,
        4.8,
      )
        .normalize()
        .multiplyScalar(distance)
        .add(center),
    );
    controls.maxDistance = Math.max(10, distance * 1.8);
    controls.minDistance = Math.min(3.1, distance * 0.55);
    controls.update();
    controls.saveState();
  }
  function select(key, color) {
    if (model) {
      scene.remove(model.group);
      disposeTree(model.group);
    }
    model = createProductModel(key);
    model.group.addEventListener("material-ready", queue);
    scene.add(model.group);
    time = 0;
    playing = model.demo && !paused;
    model.update(0);
    scene.background = new THREE.Color(color);
    floor.position.y = {
      glass: -1.37,
      kettle: -1.18,
      fryer: -1.15,
      cushion: -1.1,
      towel: -0.756,
    }[key];
    selectedKey = key;
    frameCamera();
    root.dataset.activeModel = key;
    host.dataset.modelMeshes = String(
      (() => {
        let n = 0;
        model.group.traverse((o) => {
          if (o.isMesh) n++;
        });
        return n;
      })(),
    );
    host.setAttribute(
      "aria-label",
      `Visualizador 3D de ${key === "glass" ? "taça" : key === "kettle" ? "chaleira" : key === "fryer" ? "air fryer" : key === "cushion" ? "almofada" : "toalha"}. Setas giram; + e - aproximam; R restaura a vista.`,
    );
    onDemoState(model.demo ? (playing ? "playing" : "paused") : "none");
    render();
    queue();
    return model.metadata;
  }
  controls.addEventListener("change", queue);
  controls.addEventListener("start", () => {
    host.focus({ preventScroll: true });
    queue();
  });
  controls.addEventListener("end", queue);
  host.addEventListener(
    "wheel",
    (event) => {
      if (!host.matches(":focus-within")) event.stopPropagation();
    },
    { capture: true },
  );
  host.addEventListener("keydown", (event) => {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "=",
        "-",
        "r",
        "R",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    if (event.key.toLowerCase() === "r") {
      controls.reset();
      queue();
      return;
    }
    const spherical = new THREE.Spherical().setFromVector3(
      camera.position.clone().sub(controls.target),
    );
    if (event.key === "ArrowLeft") spherical.theta -= 0.18;
    if (event.key === "ArrowRight") spherical.theta += 0.18;
    if (event.key === "ArrowUp")
      spherical.phi = Math.max(0.15, spherical.phi - 0.12);
    if (event.key === "ArrowDown")
      spherical.phi = Math.min(Math.PI * 0.49, spherical.phi + 0.12);
    if (["+", "="].includes(event.key))
      spherical.radius = Math.max(controls.minDistance, spherical.radius * 0.9);
    if (event.key === "-")
      spherical.radius = Math.min(controls.maxDistance, spherical.radius / 0.9);
    camera.position.setFromSpherical(spherical).add(controls.target);
    controls.update();
    queue();
  });
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      last = 0;
      if (visible) queue();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { threshold: 0.03 },
  );
  observer.observe(root);
  document.addEventListener("visibilitychange", () => {
    last = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else queue();
  });
  host.addEventListener("three-resize", () => {
    if (model) {
      frameCamera();
      render();
    }
  });
  host.addEventListener("three-unavailable", () => {
    cancelAnimationFrame(frame);
    root.dataset.viewerState = "unavailable";
    root.querySelector("[data-studio-hint]").textContent =
      "O 3D foi interrompido. Consulte o catálogo para continuar.";
  });
  preference.addEventListener("change", () => {
    paused = preference.matches;
    last = 0;
    root.dataset.motion = paused ? "paused" : "playing";
    if (!paused) queue();
    onDemoState(
      model?.demo
        ? paused
          ? "paused"
          : playing
            ? "playing"
            : "finished"
        : "none",
    );
  });
  root.dataset.viewerState = "ready";
  return {
    select,
    setEnabled(value) {
      enabled = value;
      last = 0;
      if (!enabled) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else queue();
    },
    togglePause() {
      paused = !paused;
      root.dataset.motion = paused ? "paused" : "playing";
      last = 0;
      onDemoState(paused ? "paused" : playing ? "playing" : "finished");
      queue();
      return paused;
    },
    replay() {
      if (!model?.demo) return;
      paused = false;
      time = 0;
      playing = true;
      model.update(0);
      root.dataset.motion = "playing";
      onDemoState("playing");
      queue();
    },
    reset() {
      controls.reset();
      queue();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      if (model) disposeTree(model.group);
      stage.dispose();
    },
  };
}
