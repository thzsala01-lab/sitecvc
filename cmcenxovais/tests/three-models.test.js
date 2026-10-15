import test from "node:test";
import assert from "node:assert/strict";
import { Box3, Vector3 } from "three";
import { createProductModel, PRODUCT_KEYS } from "../three/product-models.js";
import {
  createHouse,
  sampleTour,
  sampleRoomEntry,
  TOUR_DURATION,
} from "../three/house-model.js";

test("all products are volumetric meshes and contain no photo stand-ins", () => {
  for (const key of PRODUCT_KEYS) {
    const model = createProductModel(key);
    let vertices = 0;
    model.group.traverse((o) => {
      if (o.isMesh) {
        vertices += o.geometry.attributes.position.count;
        assert.notEqual(o.name, "photo-plane");
        assert(
          o.geometry.groups.length <= 6,
          "material groups must stay batched",
        );
      }
    });
    const size = new Box3().setFromObject(model.group).getSize(new Vector3());
    assert(vertices > 100);
    assert(
      size.x > 0.2 && size.y > 0.04 && size.z > 0.2,
      `${key} must have width, height and depth`,
    );
    assert.equal(model.metadata.commercialDimensions, false);
  }
});
test("house route crosses real openings and stops before the closed door", () => {
  const house = createHouse();
  assert.equal(house.doorPivot.rotation.y, 0);
  const start = sampleTour(0),
    end = sampleTour(TOUR_DURATION);
  assert(start.position[2] > 7.2);
  assert(end.position[2] > -9 && end.position[2] < -5);
  for (let t = 0; t <= TOUR_DURATION; t += 0.1) {
    const {
      position: [x, y, z],
    } = sampleTour(t);
    assert(Math.abs(x) < 1.2);
    assert(y > 1 && y < 2);
    assert(z > -9);
  }
  house.openDoor(0.5);
  assert(house.doorPivot.rotation.y > 0);
  house.openDoor(1);
  assert(house.doorPivot.rotation.y > Math.PI / 2);
  house.openDoor(0);
  assert.equal(house.doorPivot.rotation.y, 0);
});
test("air fryer drawers slide on their own rails and close again", () => {
  const m = createProductModel("fryer");
  m.update(0);
  assert(m.parts.drawers.every((d) => d.position.z === 0));
  m.update(3);
  assert(m.parts.drawers.every((d) => d.position.z > 1));
  m.update(m.duration);
  assert(m.parts.drawers.every((d) => d.position.z === 0));
});
test("only a plain cup receives kettle water; the amber goblet never does", () => {
  const goblet = createProductModel("glass");
  assert.equal(goblet.metadata.receivesWater, false);
  assert.equal(goblet.demo, false);
  const kettle = createProductModel("kettle");
  assert.equal(kettle.metadata.receivingVessel, "plain-cup");
  kettle.update(0);
  assert.equal(kettle.parts.stream.visible, false);
  const water = kettle.parts.cup.getObjectByName("receiving-cup-water");
  const empty = water.scale.y;
  kettle.update(3.8);
  assert(kettle.parts.body.rotation.z > 0.5);
  assert.equal(kettle.parts.stream.visible, true);
  assert(water.scale.y > empty);
  const surface =
    kettle.parts.cup.position.y +
    water.position.y +
    (water.geometry.parameters.height * water.scale.y) / 2;
  assert(
    Math.abs(kettle.parts.streamEnd.y - surface) < 0.01,
    "stream must reach the liquid surface inside the cup",
  );
  kettle.update(8);
  assert.equal(kettle.parts.stream.visible, false);
  assert.equal(kettle.parts.body.rotation.z, 0);
  assert(water.scale.y > empty);
});
test("cushion softness deforms its actual vertices and then restores them", () => {
  const m = createProductModel("cushion"),
    p = m.parts.cushion.geometry.attributes.position;
  const before = p.array.slice();
  m.update(2.5);
  assert(p.array.some((v, i) => Math.abs(v - before[i]) > 0.01));
  m.update(m.duration);
  for (let i = 0; i < before.length; i++)
    assert(Math.abs(p.array[i] - before[i]) < 1e-6);
});
test("towel unrolls a closed thick mesh into a flat sheet, without NaNs", () => {
  const m = createProductModel("towel");
  const start = new Box3().setFromObject(m.group).getSize(new Vector3());
  m.update(m.duration);
  const end = new Box3().setFromObject(m.group).getSize(new Vector3());
  assert(start.y > 0.5);
  assert(end.y < 0.04 && end.y > 0.03);
  assert(end.z > 3.5);
  assert(
    m.parts.cloth.geometry.attributes.position.array.every(Number.isFinite),
  );
  assert.equal(m.metadata.generic, true);
});

test("bedroom entry crosses the door opening before turning toward the bed", () => {
  for (let t = 0; t <= 5; t += 0.05) {
    const {
      position: [x, y, z],
    } = sampleRoomEntry(t);
    if (z > -9.2) assert(Math.abs(x) < 0.65, "camera must clear the doorway");
    assert(y > 1.5);
  }
  const end = sampleRoomEntry(5);
  assert(end.position[2] < -9);
  assert(end.position[2] > -11);
});
