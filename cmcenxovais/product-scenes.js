/** Photo-based scenes using the original uploaded product PNGs.
 * Required files in public/assets/products/: taca.png, chaleira.png,
 * air-fryer.png and almofadas.png. Never substitute generated product models.
 */
const assetRoot = '/assets/products/';
const products = [
  { file: 'taca.png', label: 'Taça âmbar com acabamento facetado', type: 'glass' },
  { file: 'chaleira.png', label: 'Chaleira elétrica de vidro BE.SMART servindo água na taça', type: 'kettle' },
  { file: 'air-fryer.png', label: 'Air fryer BE.SMART de duas gavetas', type: 'fryer' },
  { file: 'almofadas.png', label: 'Almofadas azuis com estampa esportiva', type: 'cushions' },
];

export function createProductScene(index) {
  const product = products[index];
  if (!product) throw new RangeError('Produto desconhecido');
  const scene = document.createElement('div');
  scene.className = `photo-scene photo-scene--${product.type}`;
  scene.setAttribute('role', 'img');
  scene.setAttribute('aria-label', product.label);
  const photo = (file, className) => {
    const image = document.createElement('img');
    image.src = assetRoot + file;
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    image.className = className;
    scene.append(image);
    return image;
  };
  const shadow = document.createElement('div');
  shadow.className = 'photo-scene__shadow';
  scene.append(shadow);
  if (index === 0) {
    photo(product.file, 'photo-scene__glass');
    const glow = document.createElement('div');
    glow.className = 'photo-scene__glass-glint';
    scene.append(glow);
  } else if (index === 1) {
    photo('taca.png', 'photo-scene__receiving-glass');
    const liquid = document.createElement('div');
    liquid.className = 'photo-scene__water-in-glass';
    scene.append(liquid);
    const namespace = 'http://www.w3.org/2000/svg';
    const water = document.createElementNS(namespace, 'svg');
    water.setAttribute('viewBox', '0 0 100 100');
    water.setAttribute('preserveAspectRatio', 'none');
    water.setAttribute('aria-hidden', 'true');
    water.classList.add('photo-scene__water');
    for (const name of ['edge', 'shine']) {
      const path = document.createElementNS(namespace, 'path');
      path.setAttribute('d', 'M 39.2 33.5 C 34 36, 24.5 44, 24 59');
      path.classList.add(`photo-scene__stream-${name}`);
      water.append(path);
    }
    scene.append(water);
    photo(product.file, 'photo-scene__kettle');
  } else if (index === 2) {
    // Each layer uses the same original photo. CSS masks isolate the drawers.
    photo(product.file, 'photo-scene__drawer photo-scene__drawer--left');
    photo(product.file, 'photo-scene__drawer photo-scene__drawer--right');
    photo(product.file, 'photo-scene__fryer-body');
  } else {
    photo(product.file, 'photo-scene__cushions');
  }
  return scene;
}

export async function verifyProductPhotos() {
  const results = await Promise.all(products.map(({ file }) => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve({ file, available: image.naturalWidth > 0 });
    image.onerror = () => resolve({ file, available: false });
    image.src = assetRoot + file;
  })));
  return results;
}
