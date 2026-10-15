import {
  THREE,
  material,
  box,
  cylinder,
  fabric,
  torus,
  mesh,
  smooth,
} from "./geometry.js";
export const TOUR_DURATION = 12;
export function sampleTour(t) {
  const keys = [
    { t: 0, p: [0, 1.7, 19], look: [0, 1.45, 5] },
    { t: 3.6, p: [0, 1.65, 6], look: [-0.4, 1.4, 0] },
    { t: 7.3, p: [0.25, 1.65, -1.7], look: [-0.3, 1.4, -6] },
    { t: 12, p: [0, 1.65, -6], look: [0, 1.45, -9] },
  ];
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  const a = keys[i],
    b = keys[i + 1],
    u = smooth((t - a.t) / (b.t - a.t));
  return {
    position: a.p.map((v, k) => THREE.MathUtils.lerp(v, b.p[k], u)),
    target: a.look.map((v, k) => THREE.MathUtils.lerp(v, b.look[k], u)),
  };
}
export function sampleRoomEntry(t) {
  const progress = smooth((t - 1.3) / 3.7);
  return {
    position: [
      2.4 * smooth((progress - 0.8) / 0.2),
      1.65 + 0.35 * progress,
      -6 - 4.1 * progress,
    ],
    target: [0, 1.45 - 0.57 * progress, -9 - 5.2 * progress],
  };
}
export function createHouse() {
  const group = new THREE.Group();
  group.name = "modern-house";
  const plaster = material("#e7e0d5", { roughness: 0.87 }),
    wood = material("#9d7351", { roughness: 0.6 }),
    walnut = material("#614535", { roughness: 0.58 }),
    cream = material("#ded3be", { roughness: 0.9 }),
    black = material("#252927", { roughness: 0.45 }),
    brass = material("#bba275", { metalness: 0.8, roughness: 0.25 });
  const white = material("#f4efe6", { roughness: 0.85 }),
    leaf = material("#526d42", { roughness: 0.9 });
  box(group, 36, 0.16, 38, material("#78866c"), 0, -0.23, 0);
  box(group, 3.5, 0.1, 14, material("#c3bcae"), 0, -0.09, 13);
  box(group, 14.6, 0.2, 24.4, material("#ccc5b8"), 0, -0.12, -4.5);
  const plank = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.195, 0.025, 2.93),
    wood,
    72 * 8,
  );
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let x = 0; x < 72; x++)
    for (let z = 0; z < 8; z++) {
      dummy.position.set(-6.9 + x * 0.195, 0.008, 5.5 - z * 2.93);
      dummy.updateMatrix();
      plank.setMatrixAt(n, dummy.matrix);
      plank.setColorAt(
        n++,
        new THREE.Color().setHSL(
          0.085,
          0.27,
          0.43 + ((x * 7 + z * 13) % 9) * 0.012,
        ),
      );
    }
  plank.receiveShadow = true;
  group.add(plank);
  // Outer walls, entrance and large glazed openings are separate solid pieces.
  box(group, 0.2, 3.3, 24, plaster, -7, 1.65, -4.5);
  box(group, 0.2, 3.3, 24, plaster, 7, 1.65, -4.5);
  box(group, 14, 3.3, 0.2, plaster, 0, 1.65, -16.5);
  for (const x of [-6.7, -1.5, 1.5, 6.7])
    box(group, 0.6, 3.3, 0.3, white, x, 1.65, 7.2);
  box(group, 14, 0.55, 0.4, white, 0, 3.03, 7.2);
  box(group, 14.5, 0.22, 24.3, white, 0, 3.4, -4.5);
  const glazing = new THREE.MeshPhysicalMaterial({
    color: "#dbf1f3",
    roughness: 0.07,
    metalness: 0.05,
    transparent: true,
    opacity: 0.23,
    side: THREE.DoubleSide,
  });
  for (const x of [-4.1, 4.1]) {
    box(group, 4.5, 2.3, 0.045, glazing, x, 1.6, 7.2);
    box(group, 4.5, 0.08, 0.16, black, x, 0.45, 7.2);
    box(group, 4.5, 0.08, 0.16, black, x, 2.75, 7.2);
    for (const dx of [-2.25, 0, 2.25])
      box(group, 0.055, 2.3, 0.12, black, x + dx, 1.6, 7.2);
  }
  box(group, 2.5, 0.11, 1.3, material("#b8b0a1"), 0, -0.02, 7.8);
  // Living room furniture, away from the camera route.
  box(group, 4.5, 0.035, 4.1, fabric("#c3b9a2"), -3.65, 0.05, 2.05, 0.04);
  const sofa = new THREE.Group();
  group.add(sofa);
  sofa.position.set(-4.3, 0, 2.1);
  sofa.rotation.y = Math.PI / 2;
  for (const x of [-1.25, 1.25])
    for (const z of [-0.5, 0.5])
      cylinder(sofa, 0.045, 0.045, 0.25, walnut, x, 0.18, z);
  box(sofa, 3.2, 0.35, 1.35, fabric("#d4c8b4"), 0, 0.42, 0, 0.13);
  box(sofa, 3.2, 0.9, 0.25, fabric("#c9bea9"), 0, 0.92, -0.57, 0.1);
  for (const x of [-1.5, 1.5])
    box(sofa, 0.27, 0.65, 1.4, fabric("#cec2ae"), x, 0.78, 0, 0.12);
  for (const x of [-0.95, 0, 0.95])
    box(sofa, 0.9, 0.2, 1.06, fabric("#e2d6c4"), x, 0.7, 0.03, 0.09);
  const table = cylinder(group, 0.86, 0.86, 0.09, walnut, -2.4, 0.47, 2.1);
  cylinder(group, 0.24, 0.34, 0.4, black, -2.4, 0.22, 2.1);
  cylinder(group, 0.17, 0.12, 0.25, cream, -2.4, 0.64, 2.1);
  box(group, 0.45, 0.04, 0.33, white, -2.07, 0.55, 2.12);
  box(group, 2, 0.1, 0.8, walnut, 4.5, 0.4, 1.3, 0.06);
  box(group, 1.7, 0.9, 0.18, cream, 4.5, 0.85, 0.98, 0.08);
  box(group, 1.7, 0.18, 0.7, cream, 4.5, 0.6, 1.38, 0.08);
  for (const x of [3.8, 5.2])
    for (const z of [1, 1.6]) box(group, 0.07, 0.4, 0.07, walnut, x, 0.2, z);
  function plant(x, z) {
    cylinder(group, 0.23, 0.16, 0.5, cream, x, 0.25, z);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const l = mesh(
        group,
        new THREE.SphereGeometry(0.3, 12, 8),
        leaf,
        x + Math.cos(a) * 0.17,
        0.75 + (i % 3) * 0.2,
        z + Math.sin(a) * 0.17,
      );
      l.scale.set(0.38, 1.8, 0.6);
      l.rotation.z = Math.cos(a) * 0.5;
    }
  }
  plant(5.8, 5.5);
  plant(-5.9, -1.7);
  plant(3, -15);
  // Corridor to a closed bedroom door.
  for (const x of [-1.5, 1.5])
    box(group, 0.15, 3.3, 6.3, plaster, x, 1.65, -6.1);
  for (const x of [-4.3, 4.3])
    box(group, 5.4, 3.3, 0.18, plaster, x, 1.65, -3.05);
  for (const x of [-2.5, 2.5]) box(group, 3.5, 3.3, 0.18, plaster, x, 1.65, -9);
  box(group, 1.5, 0.5, 0.22, plaster, 0, 3.02, -9);
  for (const x of [-0.76, 0.76])
    box(group, 0.1, 2.82, 0.18, walnut, x, 1.4, -8.88);
  box(group, 1.62, 0.1, 0.18, walnut, 0, 2.82, -8.88);
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.7, 0, -9);
  group.add(doorPivot);
  doorPivot.name = "bedroom-door-hinge";
  box(doorPivot, 1.4, 2.72, 0.085, wood, 0.7, 1.36, 0, 0.025);
  for (const x of [0.24, 0.7, 1.16])
    box(doorPivot, 0.012, 2.45, 0.01, walnut, x, 1.36, 0.048);
  for (const y of [0.3, 1.35, 2.4])
    cylinder(doorPivot, 0.028, 0.028, 0.1, brass, 0, y, 0);
  const spindle = cylinder(
    doorPivot,
    0.033,
    0.033,
    0.1,
    brass,
    1.18,
    1.12,
    0.09,
  );
  spindle.rotation.x = Math.PI / 2;
  const handle = cylinder(
    doorPivot,
    0.025,
    0.025,
    0.21,
    brass,
    1.09,
    1.12,
    0.14,
  );
  handle.rotation.z = Math.PI / 2;
  // Bedroom: actual mattress, quilted cover, cushions and bedside furniture.
  const bed = new THREE.Group();
  bed.position.set(0, 0, -14.1);
  group.add(bed);
  box(bed, 3.5, 1.25, 0.18, wood, 0, 1, -1.75, 0.06);
  box(bed, 3.35, 0.32, 3.7, walnut, 0, 0.28, 0, 0.08);
  box(bed, 3.2, 0.4, 3.6, fabric("#eee9dc"), 0, 0.62, 0, 0.14);
  box(bed, 3.28, 0.13, 3.05, fabric("#9f2034"), 0, 0.87, 0.27, 0.09);
  box(bed, 3.28, 0.54, 0.08, fabric("#a32336"), 0, 0.6, 1.8, 0.03);
  for (const x of [-0.82, 0.82]) {
    const p = box(bed, 1.4, 0.33, 0.8, fabric("#a62c3e"), x, 1.05, -1.05, 0.16);
    p.rotation.x = 0.15;
  }
  for (const x of [-2.2, 2.2]) {
    box(bed, 0.7, 0.55, 0.65, wood, x, 0.3, -1.2, 0.035);
    cylinder(bed, 0.16, 0.2, 0.2, cream, x, 0.69, -1.2);
    cylinder(bed, 0.025, 0.025, 0.28, brass, x, 0.9, -1.2);
    cylinder(bed, 0.25, 0.18, 0.27, cream, x, 1.16, -1.2);
  }
  box(group, 5, 0.025, 5, fabric("#bcb19b"), 0, 0.03, -13.8, 0.05);
  for (let i = 0; i < 5; i++) {
    const z = 5 - i * 4.3;
    const fixture = box(
      group,
      0.65,
      0.015,
      0.12,
      new THREE.MeshStandardMaterial({
        color: "#ffe4b0",
        emissive: "#ffe4b0",
        emissiveIntensity: 2,
      }),
      0,
      3.15,
      z,
    );
  }
  // Relief artwork is geometry, rather than a picture of a room.
  for (const z of [2, -0.8]) {
    box(group, 0.06, 1.05, 0.85, walnut, -6.86, 1.85, z);
    const art = torus(group, 0.26, 0.025, brass, -6.81, 1.86, z);
    art.rotation.y = Math.PI / 2;
  }
  return {
    group,
    doorPivot,
    bed,
    openDoor(progress) {
      doorPivot.rotation.y = smooth(progress) * Math.PI * 0.53;
    },
  };
}
