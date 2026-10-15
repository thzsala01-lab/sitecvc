/** Whole original photographs: never cut, stretch or synthesize product parts. */
export function mountPhotoMotion(host, photo, previousSource, animate) {
  host
    .getAnimations({ subtree: true })
    .forEach((animation) => animation.cancel());
  const outgoing = previousSource ? document.createElement("img") : null;
  if (outgoing) {
    outgoing.src = previousSource;
    outgoing.alt = "";
    outgoing.className = "product-photo-outgoing";
    outgoing.setAttribute("aria-hidden", "true");
  }
  photo.className = "product-photo-current";
  photo.draggable = false;
  host.replaceChildren(...(outgoing ? [outgoing, photo] : [photo]));
  if (!animate) {
    outgoing?.remove();
    return;
  }
  const timing = {
    duration: 1200,
    easing: "cubic-bezier(.22,.68,.2,1)",
    fill: "both",
  };
  if (outgoing) {
    const exit = outgoing.animate(
      [
        { opacity: 1, transform: "translateX(0) rotate(0) scale(1)" },
        {
          opacity: 0,
          transform: "translate(-80px, -75px) rotate(-7deg) scale(.9)",
        },
      ],
      timing,
    );
    exit.finished.then(() => outgoing.remove()).catch(() => outgoing.remove());
  }
  const entrance = photo.animate(
    [
      {
        opacity: 0,
        transform: "translate(100px, 95px) rotate(7deg) scale(.9)",
      },
      { opacity: 1, transform: "translateX(0) rotate(0) scale(1)" },
    ],
    timing,
  );
  entrance.finished.then(() => entrance.cancel()).catch(() => {});
}
