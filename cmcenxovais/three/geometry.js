import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export { THREE };
export const material = (color, options = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.48, ...options });
export function mesh(parent, geometry, mat, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
export function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, r = 0) {
  return mesh(
    parent,
    r ? new RoundedBoxGeometry(w, h, d, 4, r) : new THREE.BoxGeometry(w, h, d),
    mat,
    x,
    y,
    z,
  );
}
export function cylinder(
  parent,
  rt,
  rb,
  h,
  mat,
  x = 0,
  y = 0,
  z = 0,
  segments = 48,
) {
  return mesh(
    parent,
    new THREE.CylinderGeometry(rt, rb, h, segments),
    mat,
    x,
    y,
    z,
  );
}
export function lathe(parent, points, mat, segments = 80) {
  return mesh(
    parent,
    new THREE.LatheGeometry(
      points.map((p) => new THREE.Vector2(...p)),
      segments,
    ),
    mat,
  );
}
export function tube(parent, points, r, mat) {
  return mesh(
    parent,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
      48,
      r,
      10,
      false,
    ),
    mat,
  );
}
export function torus(parent, r, t, mat, x = 0, y = 0, z = 0) {
  return mesh(parent, new THREE.TorusGeometry(r, t, 10, 64), mat, x, y, z);
}
export function fabric(color = "#be3042", sports = false) {
  const mat = material(color, { roughness: 0.96 });
  if (typeof document === "undefined") return mat;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  if (sports) {
    ctx.strokeStyle = "#f5f2dc";
    ctx.lineWidth = 2;
    for (const [x, y, a] of [
      [60, 55, -0.3],
      [190, 180, 0.25],
      [180, 45, 0.2],
      [55, 185, -0.1],
    ]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = "#3daf70";
      ctx.beginPath();
      ctx.moveTo(-42, -38);
      ctx.lineTo(44, -38);
      ctx.lineTo(0, 49);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#faf3db";
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#253951";
      ctx.beginPath();
      ctx.arc(-25, 0, 27, -1, 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(25, 0, 27, 2, 4);
      ctx.stroke();
      ctx.restore();
    }
  }
  for (let i = 0; i < 256; i += 3) {
    ctx.fillStyle = "#ffffff12";
    ctx.fillRect(i, 0, 1, 256);
    ctx.fillStyle = "#00000014";
    ctx.fillRect(0, i, 256, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  mat.color.set("#ffffff");
  mat.map = texture;
  mat.bumpMap = texture;
  mat.bumpScale = 0.008;
  return mat;
}
export function label(
  parent,
  text,
  w,
  h,
  x,
  y,
  z,
  color = "#ded9d3",
  background = null,
) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 512, 128);
  }
  ctx.fillStyle = color;
  ctx.font = "500 46px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const result = mesh(
    parent,
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
    x,
    y,
    z,
  );
  result.castShadow = false;
  result.receiveShadow = false;
  return result;
}
export const smooth = (t) => {
  t = THREE.MathUtils.clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
export function disposeTree(root) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  root.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
      if (m) {
        materials.add(m);
        for (const value of Object.values(m))
          if (value?.isTexture) textures.add(value);
      }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
