import { Group, Mesh, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import gsap from "gsap";
import { resources } from "../../../utils/resources";
import { animateElephpant, createElephpant, type Elephpant } from "../../../three/objects/room/elephpant";

// The cartoon elePHPant (the same rig as the desk's) walking along the PHP timeline.
// It lives in its own small transparent canvas that the timeline moves along the
// track, so it needs no changes to the main room scene. The page feeds it the scroll
// position (`setTarget`); it turns to face the way you scroll, swings its legs in
// step with the distance covered, and trumpets when it reaches the last stop.

const LEG_REACH = 0.2; // distance from a leg's centre to its hip (capsule half length)

export type TimelineElephpant = ReturnType<typeof createTimelineElephpant>;

export const createTimelineElephpant = (canvas: HTMLCanvasElement, isStill: () => boolean) => {
  let renderer: WebGLRenderer | null = null;
  let rig: Elephpant | null = null;
  let root: Group | null = null;
  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 20);
  camera.position.set(0, 0.95, 5.2);
  camera.lookAt(0, 0.62, 0);

  let legs: { leg: Mesh; sole: Mesh; x: number; phase: number }[] = [];
  let bodyRestY = 0;
  let target = 0; // track pixels the page wants us at
  let position = 0; // where we are (eased towards target)
  let facing = 1; // 1 = right, -1 = left
  let yaw = -0.35;
  let walk = 0; // 0 idle .. 1 full stride
  let stridePhase = 0;
  let celebrate = 0; // 0..1 trumpet, at the last stop
  let atEnd = false;
  let visible = false;

  const build = () => {
    rig = createElephpant(resources.items["matcap-white"], resources.items["matcap-black"]);
    // The first 8 children are the legs and their soles, in pairs, built in this order:
    // front-left, front-right, back-left, back-right. Diagonal pairs step together.
    const phases = [0, Math.PI, Math.PI, 0];
    legs = [0, 1, 2, 3].map((i) => {
      const leg = rig!.group.children[i * 2] as Mesh;
      const sole = rig!.group.children[i * 2 + 1] as Mesh;
      return { leg, sole, x: leg.position.x, phase: phases[i]! };
    });
    bodyRestY = rig.body.position.y;
    root = new Group();
    root.add(rig.group);
    rig.group.position.x = -0.2; // centre the body (head pokes out at +X) over the pivot
    scene.add(root);
  };

  const init = () => {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    resize();
    if (resources.isReady) build();
    else resources.on("ready", build);
    gsap.ticker.add(tick);
  };

  const resize = () => {
    if (!renderer) return;
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  // x in track pixels; `end` = reached the last stop.
  const setTarget = (x: number, end: boolean) => {
    target = x;
    atEnd = end;
  };

  const getPosition = () => position;

  const setVisible = (value: boolean) => {
    visible = value;
  };

  const tick = () => {
    if (!renderer || !rig || !root) return;
    const dt = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.05);
    const still = isStill();

    // Ease towards the scroll position; how far we moved drives the walk.
    const previous = position;
    position += (target - position) * (still ? 1 : Math.min(1, dt * 7));
    const moved = position - previous;
    if (Math.abs(moved) > 0.3) facing = moved > 0 ? 1 : -1;
    const speed = Math.abs(moved) / Math.max(dt, 1e-3); // px/s
    walk += ((still ? 0 : Math.min(1, speed / 220)) - walk) * Math.min(1, dt * 8);
    stridePhase += Math.abs(moved) * 0.09;

    if (!visible) return;

    // Turn smoothly to face the way we walk, a little towards the camera.
    const targetYaw = facing === 1 ? -0.35 : Math.PI + 0.35;
    yaw += (targetYaw - yaw) * (still ? 1 : Math.min(1, dt * 6));
    root.rotation.y = yaw;

    for (const { leg, sole, x, phase } of legs) {
      const angle = Math.sin(stridePhase + phase) * 0.55 * walk;
      leg.rotation.z = angle;
      leg.position.x = x + Math.sin(angle) * LEG_REACH;
      sole.position.x = x + Math.sin(angle) * LEG_REACH * 2;
    }
    rig.body.position.y = bodyRestY + Math.abs(Math.sin(stridePhase)) * 0.035 * walk;
    root.rotation.z = Math.sin(stridePhase) * 0.035 * walk;

    celebrate += ((atEnd && walk < 0.2 ? 1 : 0) - celebrate) * Math.min(1, dt * 4);
    animateElephpant(rig, gsap.ticker.time, still, celebrate, celebrate * 0.8);

    renderer.render(scene, camera);
  };

  const destroy = () => {
    gsap.ticker.remove(tick);
    renderer?.dispose();
    renderer = null;
    scene.clear();
    rig = null;
    root = null;
  };

  return { init, resize, setTarget, getPosition, setVisible, destroy };
};
