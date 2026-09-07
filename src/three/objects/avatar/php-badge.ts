import { BufferAttribute, CanvasTexture, Group, LinearSRGBColorSpace, Mesh, Shape, ShapeGeometry } from "three";

import type { Material } from "three";

// A canvas-drawn "php" badge instead of the pre-modeled GLB (php-logo-model):
// that model's "php" shape carries a built-in skew baked into its vertices (not a
// node transform — visible no matter how the group around it is rotated/scaled),
// which read as a squashed, italic-looking wordmark once sized to fit the chest.
// Drawing it ourselves gives full control over the proportions and keeps the text
// upright, matching a plain rounded "php" pill badge.
const OVAL_ASPECT = 1.7; // width / height

const CANVAS_HEIGHT = 320;
const CANVAS_WIDTH = Math.round(CANVAS_HEIGHT * OVAL_ASPECT);

const createBadgeTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // The oval geometry (createOvalGeometry) is inscribed exactly within this same
  // canvas rect, so a plain full-rect fill here already comes out as a filled oval
  // once mapped — no need to draw the ellipse shape in the canvas itself.
  ctx.fillStyle = "#1f88ff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(CANVAS_HEIGHT * 0.52)}px Arial, sans-serif`;
  ctx.fillText("php", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + CANVAS_HEIGHT * 0.02);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = LinearSRGBColorSpace;
  return texture;
};

// A flat oval (not a plain rectangle) so the badge reads as a rounded pill rather
// than a hard-edged card, matching the reference badge shape. Built directly in a
// 0..1-per-axis UV space (an ellipse of the target aspect ratio, not a unit circle
// later stretched non-uniformly) so mapping the canvas texture onto it needs no
// extra distortion — the oval's own proportions already carry the aspect ratio.
const createOvalGeometry = () => {
  const shape = new Shape();
  shape.absellipse(0, 0, OVAL_ASPECT / 2, 0.5, 0, Math.PI * 2, false, 0);

  const geometry = new ShapeGeometry(shape, 48);
  const position = geometry.attributes.position!;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = position.getX(i) / OVAL_ASPECT + 0.5;
    uv[i * 2 + 1] = position.getY(i) / 1 + 0.5;
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));

  return geometry;
};

// Returned ungrouped/uncentered at local (0,0,0) with width OVAL_ASPECT and height 1
// — callers position and uniformly scale it, same as attachPhpLogo did with the GLB.
export const createPhpBadge = (material: Material): { group: Group; material: Material } => {
  const texture = createBadgeTexture();
  const geometry = createOvalGeometry();

  const badgeMaterial = material as any;
  badgeMaterial.map = texture;

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 40;

  const group = new Group();
  group.name = "php-badge";
  group.add(mesh);

  return { group, material };
};
