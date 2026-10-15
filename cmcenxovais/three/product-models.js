import {
  THREE,
  material,
  mesh,
  box,
  cylinder,
  lathe,
  tube,
  torus,
  fabric,
  label,
  smooth,
} from "./geometry.js";
const metal = () => material("#aab0b4", { metalness: 0.86, roughness: 0.23 });
const plastic = () => material("#202226", { roughness: 0.3, metalness: 0.06 });
function crystal(color = "#f3f9ff", transmission = 0.88) {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    attenuationColor: color,
    attenuationDistance: 0.7,
    roughness: 0.055,
    transmission: transmission * 0.42,
    transparent: true,
    opacity: 0.32,
    thickness: 0.13,
    ior: 1.49,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}
function makeGlass() {
  const group = new THREE.Group();
  group.name = "amber-faceted-goblet";
  const amber = crystal("#dea24e", 0.97);
  amber.flatShading = true;
  lathe(
    group,
    [
      [0, -1.35],
      [0.43, -1.35],
      [0.49, -1.31],
      [0.46, -1.27],
      [0.21, -1.22],
      [0.12, -1.07],
      [0.15, -0.96],
      [0.09, -0.84],
      [0.08, -0.63],
      [0.15, -0.52],
      [0.13, -0.39],
      [0.12, -0.31],
      [0.26, -0.2],
      [0.43, 0.02],
      [0.54, 0.4],
      [0.58, 0.85],
      [0.58, 1.31],
      [0.555, 1.31],
      [0.555, 0.85],
      [0.515, 0.4],
      [0.4, 0.03],
      [0.23, -0.18],
      [0.1, -0.27],
    ],
    amber,
    32,
  );
  // Four triangular faces per diamond create real cut-glass highlights.
  const facets = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2,
      delta = Math.PI / 20;
    const point = (angle, y, r) => [
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r,
    ];
    const corners = [
      point(a, 0.98, 0.578),
      point(a + delta, 0.43, 0.545),
      point(a, 0.025, 0.442),
      point(a - delta, 0.43, 0.545),
    ];
    const center = point(a, 0.43, 0.565);
    for (let k = 0; k < 4; k++)
      facets.push(...center, ...corners[k], ...corners[(k + 1) % 4]);
  }
  const facetGeometry = new THREE.BufferGeometry();
  facetGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(facets, 3),
  );
  facetGeometry.computeVertexNormals();
  mesh(group, facetGeometry, amber);
  const rim = torus(group, 0.568, 0.009, amber, 0, 1.31, 0);
  rim.rotation.x = Math.PI / 2;
  return {
    group,
    duration: 0,
    demo: false,
    update() {},
    metadata: {
      reference: "Taça âmbar facetada da foto enviada",
      commercialDimensions: false,
      receivesWater: false,
    },
  };
}
function plainCup(parent, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  parent.add(group);
  lathe(
    group,
    [
      [0, 0],
      [0.29, 0],
      [0.32, 0.05],
      [0.34, 0.82],
      [0.315, 0.82],
      [0.294, 0.09],
      [0, 0.09],
    ],
    crystal("#e8f5ff"),
    64,
  );
  const fill = cylinder(
    group,
    0.292,
    0.27,
    0.01,
    new THREE.MeshPhysicalMaterial({
      color: "#a9d6e8",
      transmission: 0.7,
      roughness: 0.06,
      thickness: 0.25,
      ior: 1.333,
    }),
    0,
    0.1,
    0,
  );
  fill.name = "receiving-cup-water";
  const ripple = torus(
    group,
    0.18,
    0.006,
    material("#dffaff", { transparent: true, opacity: 0.6 }),
    0,
    0.12,
    0,
  );
  ripple.rotation.x = Math.PI / 2;
  return { group, fill, ripple };
}
function makeKettle() {
  const group = new THREE.Group();
  group.name = "reference-glass-kettle-with-plain-cup";
  const body = new THREE.Group();
  body.position.set(0.65, 0.18, 0);
  group.add(body);
  const black = plastic(),
    steel = metal(),
    glass = crystal("#e1edff", 0.91);
  lathe(
    body,
    [
      [0.46, -0.9],
      [0.62, -0.86],
      [0.66, -0.6],
      [0.62, 0.57],
      [0.55, 0.93],
      [0.51, 0.97],
      [0.48, 0.97],
      [0.52, 0.58],
      [0.57, -0.6],
      [0.54, -0.8],
      [0.46, -0.82],
    ],
    glass,
    72,
  );
  cylinder(body, 0.64, 0.65, 0.26, black, 0, -1, 0);
  cylinder(body, 0.62, 0.62, 0.045, steel, 0, -0.85, 0);
  const led = torus(
    body,
    0.59,
    0.013,
    new THREE.MeshStandardMaterial({
      color: "#739cd9",
      emissive: "#3974b8",
      emissiveIntensity: 0.4,
    }),
    0,
    -0.81,
    0,
  );
  led.rotation.x = Math.PI / 2;
  cylinder(body, 0.56, 0.57, 0.12, black, 0, 1, 0);
  cylinder(body, 0.43, 0.43, 0.025, steel, 0, 1.075, 0);
  tube(
    body,
    [
      [0.43, 0.86, 0],
      [0.94, 0.92, 0],
      [1.17, 0.48, 0],
      [1.13, -0.38, 0],
      [0.55, -0.94, 0],
    ],
    0.105,
    black,
  );
  tube(
    body,
    [
      [-0.45, 0.83, 0],
      [-0.68, 1, 0],
      [-0.95, 0.96, 0],
    ],
    0.105,
    glass,
  );
  const water = cylinder(
    body,
    0.55,
    0.57,
    1.05,
    new THREE.MeshPhysicalMaterial({
      color: "#b7d5ed",
      transmission: 0.6,
      transparent: true,
      opacity: 0.35,
      roughness: 0.04,
      thickness: 0.6,
      ior: 1.333,
    }),
    0,
    -0.26,
    0,
  );
  water.name = "kettle-water-volume";
  label(body, "BE.SMART", 0.62, 0.13, 0, -1, 0.655, "#bdbfc3");
  for (const [text, y] of [
    ["1.8L MAX", 0.63],
    ["1.5L", 0.32],
    ["1.0L", -0.07],
    ["0.5L", -0.5],
  ])
    label(body, text, 0.36, 0.1, 0, y, 0.642, "#353a45");
  const cup = plainCup(group, -1.28, -1.16, 0.28);
  cup.group.name = "plain-drinking-glass";
  const streamMaterial = new THREE.MeshPhysicalMaterial({
    color: "#c0e9f5",
    transmission: 0.68,
    roughness: 0.025,
    thickness: 0.06,
    ior: 1.333,
  });
  const streamGroup = new THREE.Group();
  group.add(streamGroup);
  streamGroup.name = "water-stream";
  const pieces = Array.from({ length: 14 }, () =>
    cylinder(streamGroup, 0.021, 0.025, 1, streamMaterial),
  );
  const up = new THREE.Vector3(0, 1, 0),
    start = new THREE.Vector3(),
    end = new THREE.Vector3(-1.28, -0.37, 0.28),
    a = new THREE.Vector3(),
    b = new THREE.Vector3();
  function point(t, out) {
    return out.set(
      THREE.MathUtils.lerp(start.x, end.x, t),
      THREE.MathUtils.lerp(start.y, end.y, t) + 0.12 * Math.sin(Math.PI * t),
      THREE.MathUtils.lerp(start.z, end.z, t),
    );
  }
  const duration = 8;
  const update = (t) => {
    const seconds = Math.min(t, duration);
    const tilt =
      smooth((seconds - 1) / 1.3) * (1 - smooth((seconds - 5.1) / 1.5));
    body.rotation.z = tilt * 0.62;
    body.updateMatrix();
    start.set(-0.95, 0.96, 0).applyMatrix4(body.matrix);
    const filled = smooth((seconds - 2.2) / 2.8);
    water.scale.y = 1 - filled * 0.35;
    water.position.y = -0.26 - filled * 0.18;
    streamGroup.visible = seconds > 2.2 && seconds < 5.1;
    const h = 0.01 + filled * 0.56;
    cup.fill.scale.y = h / 0.01;
    cup.fill.position.y = 0.1 + h / 2;
    cup.ripple.position.y = 0.1 + h + 0.005;
    end.y = cup.group.position.y + 0.1 + h + 0.008;
    cup.ripple.visible = streamGroup.visible;
    cup.ripple.scale.setScalar(0.75 + Math.sin(seconds * 12) * 0.18);
    for (let i = 0; i < pieces.length; i++) {
      point(i / pieces.length, a);
      point((i + 1) / pieces.length, b);
      const p = pieces[i];
      p.position.copy(a).add(b).multiplyScalar(0.5);
      p.scale.y = a.distanceTo(b);
      p.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
    }
  };
  update(0);
  return {
    group,
    duration,
    demo: true,
    update,
    metadata: {
      reference: "Chaleira de vidro BE.SMART da foto; copo liso auxiliar",
      commercialDimensions: false,
      receivingVessel: "plain-cup",
    },
    parts: { body, cup: cup.group, stream: streamGroup, streamEnd: end },
  };
}
function makeFryer() {
  const group = new THREE.Group();
  group.name = "dual-drawer-air-fryer";
  const black = plastic(),
    inner = material("#151618", { roughness: 0.65 }),
    steel = metal();
  box(group, 2.6, 0.95, 1.95, black, 0, 0.77, 0, 0.22);
  box(group, 2.6, 0.16, 1.95, black, 0, -1.05, 0, 0.06);
  for (const x of [-1.23, 1.23])
    box(group, 0.14, 1.45, 1.9, black, x, -0.24, -0.01, 0.055);
  box(group, 2.36, 1.42, 0.1, black, 0, -0.24, -0.91, 0.025);
  box(group, 0.09, 1.42, 1.75, black, 0, -0.24, -0.02, 0.025);
  const panel = box(
    group,
    2.32,
    0.64,
    0.07,
    material("#111418", { roughness: 0.23 }),
    0,
    0.75,
    0.991,
    0.08,
  );
  panel.rotation.x = -0.13;
  label(group, "888     888", 1.65, 0.23, 0, 0.85, 1.038, "#d8d9d1");
  label(group, "BE.SMART", 0.64, 0.1, 0, 0.32, 1.047, "#85868b");
  for (const x of [-0.93, -0.62, -0.31, 0.31, 0.62, 0.93]) {
    const dial = torus(group, 0.048, 0.005, steel, x, 0.56, 1.057);
    dial.castShadow = false;
  }
  const drawers = [];
  for (const x of [-0.61, 0.61]) {
    const drawer = new THREE.Group();
    drawer.position.set(x, -0.31, 0);
    group.add(drawer);
    drawer.name = x < 0 ? "left-drawer" : "right-drawer";
    box(drawer, 1.13, 0.065, 1.65, inner, 0, -0.64, 0, 0.025);
    for (const side of [-0.54, 0.54])
      box(drawer, 0.055, 1.12, 1.63, inner, side, -0.08, 0, 0.025);
    box(drawer, 1.1, 1.1, 0.055, inner, 0, -0.08, -0.8, 0.025);
    box(drawer, 1.18, 1.32, 0.15, black, 0, -0.04, 0.91, 0.07);
    for (let i = 0; i < 6; i++)
      box(
        drawer,
        0.68,
        0.012,
        0.016,
        material("#44484c", { metalness: 0.5, roughness: 0.6 }),
        0,
        -0.598,
        -0.52 + i * 0.2,
      );
    box(drawer, 0.2, 0.81, 0.22, steel, 0, -0.04, 1.09, 0.055);
    box(drawer, 0.13, 0.68, 0.055, black, 0, -0.035, 1.22, 0.035);
    drawers.push(drawer);
  }
  const duration = 7;
  const update = (t) => {
    drawers.forEach((d, i) => {
      const s = Math.min(t, duration) - i * 0.35;
      d.position.z =
        smooth((s - 0.6) / 1.4) * (1 - smooth((s - 4.4) / 1.45)) * 1.13;
    });
  };
  update(0);
  return {
    group,
    duration,
    demo: true,
    update,
    metadata: {
      reference: "Air fryer BE.SMART de duas gavetas da foto",
      commercialDimensions: false,
      unseenDetails: "Volumes neutros; sem especificações de aquecimento",
    },
    parts: { drawers },
  };
}
function makeCushion() {
  const group = new THREE.Group();
  group.name = "sports-cushion";
  const geo = new THREE.SphereGeometry(1, 64, 48),
    p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    p.setXYZ(
      i,
      Math.sign(x) * Math.pow(Math.abs(x), 0.5) * 1.05,
      Math.sign(y) * Math.pow(Math.abs(y), 0.5) * 1.05,
      z * 0.34,
    );
  }
  // Project the supplied front print onto a fully volumetric, deformable mesh.
  // Unseen back/side surfaces stay a neutral fabric rather than inventing artwork.
  for (let i = 0; i < p.count; i++) {
    const u = 0.08 + (0.84 * (p.getX(i) + 1.05)) / 2.1,
      v = 0.08 + (0.84 * (p.getY(i) + 1.05)) / 2.1;
    const bottomX = 176 + (550 - 176) * u,
      bottomY = 430 + (425 - 430) * u;
    const topX = 208 + (540 - 208) * u,
      topY = 85 + (50 - 85) * u;
    geo.attributes.uv.setXY(
      i,
      (bottomX * (1 - v) + topX * v) / 562,
      1 - (bottomY * (1 - v) + topY * v) / 444,
    );
  }
  geo.computeVertexNormals();
  const initial = p.array.slice(),
    base = fabric("#1764bf"),
    print = base.clone();
  if (typeof document !== "undefined") {
    const map = new THREE.TextureLoader().load(
      "/assets/products/almofadas.png",
      () => group.dispatchEvent({ type: "material-ready" }),
      undefined,
      () => {
        print.map = null;
        print.color.set("#1764bf");
        print.needsUpdate = true;
        group.dispatchEvent({ type: "material-ready" });
      },
    );
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    print.map = map;
  }
  const frontIndices = [],
    backIndices = [];
  for (let i = 0; i < geo.index.count; i += 3) {
    const ids = [
      geo.index.getX(i),
      geo.index.getX(i + 1),
      geo.index.getX(i + 2),
    ];
    const front = ids.reduce((sum, index) => sum + p.getZ(index), 0) > 0;
    (front ? frontIndices : backIndices).push(...ids);
  }
  geo.setIndex([...backIndices, ...frontIndices]);
  geo.clearGroups();
  geo.addGroup(0, backIndices.length, 0);
  geo.addGroup(backIndices.length, frontIndices.length, 1);
  const cushion = mesh(group, geo, [base, print]);
  cushion.rotation.z = -0.08;
  const seam = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    seam.push(
      new THREE.Vector3(
        Math.sign(Math.cos(a)) * Math.sqrt(Math.abs(Math.cos(a))) * 1.05,
        Math.sign(Math.sin(a)) * Math.sqrt(Math.abs(Math.sin(a))) * 1.05,
        0,
      ),
    );
  }
  mesh(
    cushion,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(seam),
      128,
      0.013,
      6,
      false,
    ),
    material("#d5d8b8", { roughness: 0.95 }),
  );
  const duration = 6;
  const update = (t) => {
    const strength = smooth((t - 0.6) / 1.5) * (1 - smooth((t - 3.5) / 1.7));
    for (let i = 0; i < p.count; i++) {
      const x = initial[i * 3],
        y = initial[i * 3 + 1],
        z = initial[i * 3 + 2];
      const influence = Math.exp(-((x - 0.1) ** 2 + (y - 0.05) ** 2) * 5);
      p.setZ(i, z - (z > 0 ? 0.235 * strength * influence : 0));
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return {
    group,
    duration,
    demo: true,
    update,
    metadata: {
      reference:
        "Almofada azul esportiva; estampa da referência aplicada por UV à malha volumétrica",
      commercialDimensions: false,
    },
    parts: { cushion, initial },
  };
}
function makeTowel() {
  const group = new THREE.Group();
  group.name = "cloth-unrolling-study";
  const nx = 24,
    ny = 96,
    w = 1.7,
    length = 3.6;
  const positions = new Float32Array((nx + 1) * (ny + 1) * 2 * 3),
    indices = [];
  const stride = (nx + 1) * (ny + 1);
  for (let layer = 0; layer < 2; layer++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const a = layer * stride + j * (nx + 1) + i,
          b = a + 1,
          c = a + nx + 1,
          d = c + 1;
        if (layer === 0) indices.push(a, b, c, b, d, c);
        else indices.push(a, c, b, b, c, d);
      }
  for (let j = 0; j < ny; j++)
    for (const i of [0, nx]) {
      const a = j * (nx + 1) + i,
        b = a + nx + 1;
      indices.push(a, a + stride, b, b, a + stride, b + stride);
    }
  for (const j of [0, ny])
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      indices.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  const uv = new Float32Array((nx + 1) * (ny + 1) * 2 * 2);
  for (let k = 0; k < 2; k++)
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        const a = (k * stride + j * (nx + 1) + i) * 2;
        uv[a] = (i / nx) * 4;
        uv[a + 1] = (j / ny) * 8;
      }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const cloth = mesh(group, geo, fabric("#e2dbca"));
  cloth.name = "deforming-towel-volume";
  const duration = 7;
  const update = (t) => {
    const u = smooth((t - 0.4) / 5.5),
      flat = u * length,
      R = Math.max(0.07, 0.48 * Math.sqrt(1 - u));
    for (let layer = 0; layer < 2; layer++)
      for (let j = 0; j <= ny; j++)
        for (let i = 0; i <= nx; i++) {
          const s = (j / ny) * length,
            offset = (layer === 0 ? 1 : -1) * 0.016;
          let z = 1.65 - s,
            y = -0.73;
          if (s > flat) {
            const angle = (s - flat) / R,
              r = R - (0.025 * angle) / (Math.PI * 2);
            z = 1.65 - flat - r * Math.sin(angle);
            y = -0.73 + R - r * Math.cos(angle);
            const a = (layer * stride + j * (nx + 1) + i) * 3;
            positions[a] = (i / nx - 0.5) * w;
            positions[a + 1] = y + offset * Math.cos(angle);
            positions[a + 2] = z + offset * Math.sin(angle);
          } else {
            const a = (layer * stride + j * (nx + 1) + i) * 3;
            positions[a] = (i / nx - 0.5) * w;
            positions[a + 1] = y + offset;
            positions[a + 2] = z;
          }
        }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
  };
  update(0);
  return {
    group,
    duration,
    demo: true,
    update,
    metadata: {
      reference:
        "Demonstração genérica de toalha, sem modelo comercial ou medidas informadas",
      commercialDimensions: false,
      generic: true,
    },
    parts: { cloth },
  };
}
export const PRODUCT_KEYS = ["glass", "kettle", "fryer", "cushion", "towel"];
export function createProductModel(key) {
  const factory = {
    glass: makeGlass,
    kettle: makeKettle,
    fryer: makeFryer,
    cushion: makeCushion,
    towel: makeTowel,
  }[key];
  if (!factory) throw new RangeError("Produto desconhecido");
  return factory();
}
