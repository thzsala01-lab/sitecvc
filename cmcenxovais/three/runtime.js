import { THREE } from "./geometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
export function createStage(host, { background = null, shadows = true } = {}) {
  const mobile = matchMedia("(max-width: 700px)").matches;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: !background,
    powerPreference: "high-performance",
  });
  const gl = renderer.getContext(),
    debug = gl.getExtension("WEBGL_debug_renderer_info");
  const software =
    debug &&
    /swiftshader|llvmpipe|software/i.test(
      gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
    );
  const pixelBudget = software ? 360000 : mobile ? 650000 : 1200000;
  renderer.transmissionResolutionScale = mobile || software ? 0.5 : 0.75;
  renderer.setClearColor(background || 0x000000, background ? 1 : 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 0.08, 100);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.06);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.replaceChildren(renderer.domElement);
  let lost = false;
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    host.dispatchEvent(new Event("three-unavailable"));
  });
  const resize = () => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height || lost) return;
    renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        mobile ? 1.25 : 1.5,
        Math.sqrt(pixelBudget / (r.width * r.height)),
      ),
    );
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    host.dispatchEvent(new Event("three-resize"));
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return {
    renderer,
    scene,
    camera,
    mobile,
    software,
    draw() {
      if (!lost) renderer.render(scene, camera);
    },
    dispose() {
      observer.disconnect();
      environment.dispose();
      renderer.dispose();
    },
  };
}
export function studioLights(scene, mobile) {
  scene.add(new THREE.HemisphereLight("#fff7ed", "#756966", 0.9));
  const key = new THREE.DirectionalLight("#fff7e9", 2.2);
  key.position.set(3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(mobile ? 512 : 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.normalBias = 0.025;
  scene.add(key);
  const fill = new THREE.DirectionalLight("#c8dcff", 1.1);
  fill.position.set(-4, 3, -3);
  scene.add(fill);
}
