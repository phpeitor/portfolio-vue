import { CylinderGeometry, Group, Mesh, TorusGeometry } from "three";

import type { Box3, Material } from "three";

const LENS_SEGMENTS = 24;
const TUBE_SEGMENTS = 10;

const createRing = (radius: number, tube: number, material: Material) => {
  const mesh = new Mesh(new TorusGeometry(radius, tube, TUBE_SEGMENTS, LENS_SEGMENTS), material);
  // TorusGeometry faces its own local Z by default; rotate it onto local X so it
  // faces the camera once placed (see axis note below).
  mesh.rotation.y = Math.PI / 2;
  mesh.frustumCulled = false;
  mesh.renderOrder = 26;
  return mesh;
};

// Builds a simple round-frame accessory sized from the face sprite's own bounding box,
// so it stays proportional if that mesh ever changes.
//
// Axis note: the avatar armature bakes a Blender (Z-up) -> three.js (Y-up) axis
// conversion into its own root rotation, so this mesh's *local* axes don't match
// screen space directly. In local space: left-right = local Y, up-down = -local Z,
// front/back (toward camera = smaller value) = local X.
export const createGlasses = (faceBox: Box3, material: Material): Group => {
  const widthLR = faceBox.max.y - faceBox.min.y;
  const heightUD = faceBox.max.z - faceBox.min.z;
  const centerLR = (faceBox.max.y + faceBox.min.y) / 2;

  const lensRadius = widthLR * 0.16;
  const tube = lensRadius * 0.22;
  const eyeOffsetLR = widthLR * 0.235;
  const eyeUD = faceBox.max.z - heightUD * 0.6;
  const eyeFront = faceBox.min.x - tube * 0.6;

  const group = new Group();
  group.name = "glasses";

  const leftLens = createRing(lensRadius, tube, material);
  leftLens.position.set(eyeFront, centerLR - eyeOffsetLR, eyeUD);
  group.add(leftLens);

  const rightLens = createRing(lensRadius, tube, material);
  rightLens.position.set(eyeFront, centerLR + eyeOffsetLR, eyeUD);
  group.add(rightLens);

  const bridgeLength = eyeOffsetLR * 2 - lensRadius * 1.7;
  const bridge = new Mesh(new CylinderGeometry(tube, tube, Math.max(bridgeLength, tube), 8), material);
  // CylinderGeometry's length already runs along local Y (left-right here) — no rotation needed.
  bridge.position.set(eyeFront, centerLR, eyeUD);
  bridge.frustumCulled = false;
  bridge.renderOrder = 26;
  group.add(bridge);

  return group;
};
