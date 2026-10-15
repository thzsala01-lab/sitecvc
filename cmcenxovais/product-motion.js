const types = ["glass", "kettle", "fryer", "cushions"];
const ratios = ["599 / 1200", "1076 / 1200", "1", "562 / 444"];
export function mountPhotoMotion(host, photo, index) {
  const scene = document.createElement("div");
  scene.className = "product-photo-scene product-photo-scene--" + types[index];
  const frame = document.createElement("div");
  frame.className = "product-photo-scene__frame";
  frame.style.setProperty("--photo-ratio", ratios[index]);
  frame.style.setProperty(
    "--photo-factor",
    [599 / 1200, 1076 / 1200, 1, 562 / 444][index],
  );
  scene.append(frame);
  photo.className = index === 2 ? "product-fryer-body" : "";
  frame.append(photo);
  function layer(className) {
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = "";
    img.draggable = false;
    img.setAttribute("aria-hidden", "true");
    img.className = className;
    frame.append(img);
  }
  if (index === 1) layer("product-kettle-lid");
  if (index === 2) {
    layer("product-drawer--left");
    layer("product-drawer--right");
  }
  host.replaceChildren(scene);
}
