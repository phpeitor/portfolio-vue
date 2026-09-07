import { Group, Mesh, TorusGeometry, Vector3 } from "three";

import type { Material } from "three";

// Builds a small, subtle smile — a short arc segment — sized off the whole avatar's
// world-space bounding box. Mirrors createGlasses: children sit at local (0,0,0) so
// the returned group only needs its position set once (see attachMouth in
// avatar/index.ts, parented directly onto headBone) to track the head bone.
export const createMouth = (avatarSize: Vector3, material: Material): Group => {
  const group = new Group();
  group.name = "mouth";

  const mouthRadius = avatarSize.x * 0.028;
  const tube = avatarSize.x * 0.0032;
  const arcSpan = Math.PI * 0.55;

  const arc = new Mesh(new TorusGeometry(mouthRadius, tube, 8, 16, arcSpan), material);
  // A torus arc sweeps from angle 0 (positive X) by `arcSpan` — rotate it so the
  // visible segment sits centered at the bottom of the circle, reading as a
  // downward-curving "smile" arc instead of a random slice of a ring.
  arc.rotation.z = -Math.PI / 2 - arcSpan / 2;
  arc.frustumCulled = false;
  arc.renderOrder = 26;
  group.add(arc);

  return group;
};
