import { DodecahedronGeometry, Group, InstancedMesh, Matrix4, Vector3 } from "three";

import type { Material } from "three";

// Deterministic pseudo-random so the stubble pattern is stable across reloads
// instead of reshuffling into a different scatter every time the avatar mounts.
let seed = 1;
const random = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const matrix = new Matrix4();
const position = new Vector3();

// Builds a sparse cluster of tiny dots along the jaw/chin — a subtle stubble/shadow
// rather than a solid beard shape — sized off the whole avatar's world-space
// bounding box. Mirrors createGlasses: children sit at local (0,0,0) so the
// returned group only needs its `.position` updated each frame (see updateBeard in
// avatar/index.ts) to track the head bone.
export const createBeard = (avatarSize: Vector3, material: Material): Group => {
  const group = new Group();
  group.name = "beard";
  seed = 1;

  const jawHalfWidth = avatarSize.x * 0.04;
  const chinDrop = avatarSize.y * 0.016;
  const dotRadius = avatarSize.x * 0.003;

  const points: Vector3[] = [];

  // Chin cluster: a small patch directly under the mouth.
  for (let i = 0; i < 8; i++) {
    points.push(
      new Vector3(
        (random() - 0.5) * jawHalfWidth * 0.7,
        -chinDrop * (0.5 + random() * 0.5),
        avatarSize.z * (0.13 + random() * 0.02),
      ),
    );
  }

  // Jawline: a low, sparse line from the chin toward each cheek — stays well below
  // eye/ear height so it never reaches up toward the glasses.
  const JAW_POINTS = 7;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < JAW_POINTS; i++) {
      const t = i / (JAW_POINTS - 1);
      points.push(
        new Vector3(
          side * jawHalfWidth * (0.35 + t * 0.75) + (random() - 0.5) * jawHalfWidth * 0.1,
          -chinDrop * (1 - t * 0.5) + (random() - 0.5) * chinDrop * 0.15,
          avatarSize.z * (0.135 - t * 0.04) + (random() - 0.5) * avatarSize.z * 0.008,
        ),
      );
    }
  }

  const geometry = new DodecahedronGeometry(dotRadius, 0);
  const dots = new InstancedMesh(geometry, material, points.length);
  dots.frustumCulled = false;
  dots.renderOrder = 26;

  points.forEach((point, index) => {
    const scale = 0.7 + random() * 0.6;
    matrix.makeScale(scale, scale, scale);
    position.copy(point);
    matrix.setPosition(position);
    dots.setMatrixAt(index, matrix);
  });
  dots.instanceMatrix.needsUpdate = true;

  group.add(dots);

  return group;
};
