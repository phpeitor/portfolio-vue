import { resources } from "../../../utils/resources";
import { AnimationMixer, Box3, Group, LoopRepeat, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import gsap from "gsap";
import { sceneWeights } from "../../../animations/scenes";
import { room } from ".";

import type { MeshStandardMaterial } from "three";

let model: Group | null = null;
let mixer: AnimationMixer | null = null;
let walkTimeline: gsap.core.Timeline | null = null;
// The source clip bakes forward locomotion into this bone's own translation (a
// ~525-unit swing) instead of keeping it in place for a walk-in-place cycle — since
// we already drive the model's forward motion ourselves via the GSAP timeline below,
// leaving the clip's translation live doubles the movement, snapping the character
// across huge distances every frame. Freezing the bone to its rest position after
// each mixer update cancels that baked-in drift while keeping the leg/spine rotation
// keyframes (the actual walk cycle) intact.
let hipBone: Object3D | null = null;
let hipRestPosition: Vector3 | null = null;

// Builds a short back-and-forth "patrol" across the carpet instead of a one-shot
// walk: tween the X position between the two edges, flipping to face the direction
// of travel at each end, looping forever.
const startWalking = (bounds: { min: number; max: number }, z: number, y: number) => {
  if (!model) return;

  const duration = (bounds.max - bounds.min) * 3.5;
  const turnDuration = 0.4;

  walkTimeline = gsap.timeline({ repeat: -1 });
  walkTimeline.set(model.position, { x: bounds.min, y, z });
  walkTimeline.set(model.rotation, { y: Math.PI / 2 });
  walkTimeline.to(model.position, { x: bounds.max, duration, ease: "none" });
  walkTimeline.to(model.rotation, { y: -Math.PI / 2, duration: turnDuration, ease: "power1.inOut" });
  walkTimeline.to(model.position, { x: bounds.min, duration, ease: "none" });
  walkTimeline.to(model.rotation, { y: Math.PI / 2, duration: turnDuration, ease: "power1.inOut" });
};

const init = (carpet: Mesh | null, chair: Mesh | null) => {
  if (model) return;
  const resource = resources.items["baby-elephant-model"];
  if (!resource || !carpet) return;

  // A rigged/skinned model (has bones + a walk-cycle animation) — a plain
  // .clone(true) copies the mesh hierarchy but not the skeleton/bone bindings
  // correctly, leaving the SkinnedMesh's skinning tied to the ORIGINAL (unrendered)
  // bones instead of the new clone's, which silently renders it invisible/nowhere
  // useful regardless of the wrapper Group's own position. Same fix already used for
  // the avatar's own rig in three/objects/avatar/index.ts.
  model = cloneSkeleton(resource.scene) as Group;
  model.name = "baby-elephant";

  // No lights anywhere in this scene (everything else here is unlit/matcap for the
  // same reason, see the laptop prop in contact/index.ts) — the model's authored
  // MeshStandardMaterial would render pure black without one, so swap in an unlit
  // material that keeps its diffuse texture but doesn't need a light to be visible.
  model.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.frustumCulled = false;
    const standardMaterial = child.material as MeshStandardMaterial;
    child.material = new MeshBasicMaterial({ map: standardMaterial.map });
  });

  const carpetBox = new Box3().setFromObject(carpet);
  const carpetSize = new Vector3();
  const carpetCenter = new Vector3();
  carpetBox.getSize(carpetSize);
  carpetBox.getCenter(carpetCenter);

  // Scaled relative to the carpet's own footprint rather than a fixed guess, so it
  // stays proportionate if the room model/carpet ever changes size.
  model.updateMatrixWorld(true);
  const modelBox = new Box3().setFromObject(model);
  const modelSize = new Vector3();
  modelBox.getSize(modelSize);

  const targetHeight = carpetSize.x * 0.22;
  const scale = targetHeight / (modelSize.y || 1);
  model.scale.setScalar(scale);

  // Re-measure after scaling to find how far it can walk before stepping off the
  // carpet's edge, and how high its feet need to sit to rest on the carpet surface.
  model.updateMatrixWorld(true);
  const scaledBox = new Box3().setFromObject(model);
  const scaledSize = new Vector3();
  scaledBox.getSize(scaledSize);

  // The desk/chair sit roughly mid-carpet in Z, so a walk at carpetCenter.z (or the
  // carpet's own X center) stays permanently tucked behind/under them — confirmed by
  // sprinkling markers across the carpet's Box3 and checking which ones actually
  // landed in the visible open corner (near carpetBox.min.x, carpetBox.max.z — the
  // near-camera foreground edge of the rug) versus the desk-occluded middle.
  // The far edge is clamped to stay clear of the chair (by its own measured bounds,
  // not a guessed fraction) rather than a fixed carpet fraction — an earlier fixed
  // 0.22 fraction combined with the near-edge margin left a walkable span *narrower*
  // than the model's own body, so it flipped direction almost every second instead of
  // taking real strides — that's what read as "jumping" rather than walking.
  const nearEdge = carpetBox.min.x + carpetSize.x * 0.04;
  let farEdge = carpetBox.min.x + carpetSize.x * 0.42;
  if (chair) {
    const chairBox = new Box3().setFromObject(chair);
    farEdge = Math.min(farEdge, chairBox.min.x - scaledSize.x * 0.6);
  }
  const bounds = {
    min: nearEdge,
    max: Math.max(farEdge, nearEdge + scaledSize.x * 2.5),
  };
  const walkZ = carpetBox.max.z - carpetSize.z * 0.12;
  // model.position is still (0,0,0) here, so scaledBox.min.y is exactly how far the
  // model's feet currently sit from local origin — shifting position.y by the gap
  // between that and the carpet's top surface rests the feet exactly on the carpet.
  const groundY = carpetBox.max.y - scaledBox.min.y;

  room.group.add(model);
  startWalking(bounds, walkZ, groundY);

  hipBone = model.getObjectByName("Elephant_Baby:Mesh:Hip") ?? null;
  hipRestPosition = hipBone ? hipBone.position.clone() : null;

  const clip = resource.animations[0];
  if (clip) {
    mixer = new AnimationMixer(model);
    const action = mixer.clipAction(clip);
    action.setLoop(LoopRepeat, Infinity);
    action.play();
  }
};

const tick = () => {
  if (!model) return;

  model.visible = sceneWeights.hero > 0.001;
  if (!model.visible) return;

  if (mixer) {
    const delta = gsap.ticker.deltaRatio(60);
    mixer.update(delta / 60);
    if (hipBone && hipRestPosition) hipBone.position.copy(hipRestPosition);
  }
};

const destroy = () => {
  walkTimeline?.kill();
  walkTimeline = null;
  mixer = null;
  model = null;
  hipBone = null;
  hipRestPosition = null;
};

export const babyElephant = { init, tick, destroy };
