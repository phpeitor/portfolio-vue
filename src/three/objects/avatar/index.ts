import { resources } from "../../../utils/resources";
import {
  Box3,
  Mesh,
  Vector3,
  Euler,
  Group,
  ShaderMaterial,
  LinearSRGBColorSpace,
  MeshBasicMaterial,
  MeshMatcapMaterial,
} from "three";
import { scene } from "../../core/scene";
import { animations } from "./animations";
import { sceneWeights, sceneWeightsInOut } from "../../../animations/scenes";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { face } from "./face";
import { leftDesktop as avatarLeftDesktop } from "./left-desktop";
import { createGlasses } from "./glasses";
import matcapVertexShader from "../../shaders/avatar-matcap/vertex.glsl";
import matcapFragmentShader from "../../shaders/avatar-matcap/fragment.glsl";
import headVertexShader from "../../shaders/avatar-head/vertex.glsl";
import headFragmentShader from "../../shaders/avatar-head/fragment.glsl";
import gsap from "gsap";
import { aboutProgress } from "../../../animations/transitions/about";
//import { avatarHologram } from "./hologram";

import type { Material, Bone, Texture } from "three";

let mesh: Mesh | null = null;
let rightHandBone: Bone | null = null;
let phpLogo: Group | null = null;

const tIdleIntensity = { value: 0 };

const waypointsPosition = new Vector3();
const waypointsRotation = new Euler();
const transform = new Group();
const uniforms = { uProgress: { value: 0 }, uAmbientStrength: { value: 0 } };
const contactPosition = new Vector3(0, -13, 0);
const contactRotation = new Euler(0, -Math.PI, 0);
const phpLogoMaterial = new MeshBasicMaterial({ color: 0x1f88ff });

const init = () => {
  setupMesh();
  animations.init();
  face.init();
  avatarLeftDesktop.init();
  gsap.ticker.add(tick);
};

const getMaterial = (name: string): Material | null => {
  if (name === "face") return face.getMaterial();
  if (name === "head") {
    const texture = resources.items["head-texture"];
    texture.flipY = false;
    texture.colorSpace = LinearSRGBColorSpace;
    texture.generateMipmaps = false;
    return new ShaderMaterial({
      vertexShader: headVertexShader,
      fragmentShader: headFragmentShader,
      transparent: true,
      uniforms: {
        uHeadTexture: { value: texture },
        ...uniforms,
      },
    });
  }

  const tex = resources.items["matcap-black"];
  tex.colorSpace = LinearSRGBColorSpace;
  tex.generateMipmaps = false;

  return new ShaderMaterial({
    vertexShader: matcapVertexShader,
    fragmentShader: matcapFragmentShader,
    transparent: true,
    uniforms: {
      uMatcap: { value: tex },
      ...uniforms,
    },
  });
};

const assignMatcap = (child: Mesh): boolean => {
  let tex: Texture | null = null;

  if (child.name === "black") {
    tex = resources.items["matcap-black"];
  } else if (child.name === "gray") {
    tex = resources.items["matcap-gray"];
  } else if (child.name === "skin") {
    tex = resources.items["matcap-skin"];
  } else if (child.name === "white") {
    tex = resources.items["matcap-white"];
  }

  if (tex) {
    tex.colorSpace = LinearSRGBColorSpace;
    child.userData.matcap = tex;
    return true;
  }

  return false;
};

const setupMesh = () => {
  if (mesh) return;
  const resource = resources.items["avatar-model"];
  mesh = cloneSkeleton(resource.scene.children[0]) as Mesh;

  mesh.frustumCulled = false;

  mesh.traverse((child) => {
    if (child instanceof Mesh) {
      const mat = getMaterial(child.name);
      if (!mat) return;
      child.material = mat;
      child.frustumCulled = false;
      child.renderOrder = child.name === "face" ? 25 : 24;

      const hasMatcap = assignMatcap(child);
      if (hasMatcap) {
        child.onBeforeRender = () => {
          child.material.uniforms.uMatcap.value = child.userData.matcap;
        };
      }
    }
  });

  const brain = mesh.getObjectByName("brain") as Mesh;
  if (brain) {
    mesh.remove(brain);
  }

  attachGlasses();
  attachPhpLogo();

  mesh.rotation.z = 0;

  transform.add(mesh);

  rightHandBone = mesh.getObjectByName("bone-right-hand") as Bone;

  scene.instance.add(transform);
};

const attachGlasses = () => {
  if (!mesh) return;

  const faceMesh = mesh.getObjectByName("face") as Mesh | null;
  if (!faceMesh) return;

  faceMesh.geometry.computeBoundingBox();
  const box = faceMesh.geometry.boundingBox;
  if (!box) return;

  // Plain (non-skinned) accessory: use the built-in matcap material instead of the
  // avatar's custom shader, which hard-requires a SkinnedMesh (boneMatX/skinWeight).
  const matcapTexture = resources.items["matcap-black"];
  matcapTexture.colorSpace = LinearSRGBColorSpace;
  matcapTexture.generateMipmaps = false;
  const material = new MeshMatcapMaterial({ matcap: matcapTexture });

  mesh.add(createGlasses(box, material));
};

const attachPhpLogo = () => {
  if (!mesh || phpLogo) return;

  const resource = resources.items["php-logo-model"];
  if (!resource) return;

  const frontLogo = new Group();
  const logoScene = resource.scene.clone(true) as Group;
  frontLogo.name = "php-logo-front";

  const avatarBox = new Box3().setFromObject(mesh);
  const avatarSize = new Vector3();
  avatarBox.getSize(avatarSize);

  logoScene.updateMatrixWorld(true);
  const logoBox = new Box3().setFromObject(logoScene);
  const logoSize = new Vector3();
  const logoCenter = new Vector3();
  logoBox.getSize(logoSize);
  logoBox.getCenter(logoCenter);
  logoScene.position.sub(logoCenter);
  frontLogo.add(logoScene);

  const chestWidth = avatarSize.x * 0.22;
  const chestHeight = avatarSize.y * 0.10;
  const scale = Math.min(chestWidth / Math.max(logoSize.x, 0.0001), chestHeight / Math.max(logoSize.y, 0.0001)) * 1.35;

  const styleLogo = (object: Group) => {
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;

      child.frustumCulled = false;
      child.renderOrder = 40;
      child.material = phpLogoMaterial;

      const material = child.material as any;
      if (material) {
        material.transparent = true;
        material.depthTest = false;
        material.depthWrite = false;
        material.side = 2;
      }
    });
  };

  styleLogo(frontLogo);

  frontLogo.scale.setScalar(scale);

  frontLogo.rotation.set(0, 0, 0);

  scene.instance.add(frontLogo);
  phpLogo = frontLogo;
};

const tick = () => {
  animations.update();

  const isContact = sceneWeights.contact > 0.001;

  if (isContact) {
    transform.position.copy(contactPosition);
    transform.rotation.copy(contactRotation);
    uniforms.uProgress.value = 0;
    uniforms.uAmbientStrength.value = 0;
    transform.visible = true;
    updatePhpLogo();
    return;
  }

  transform.position.copy(waypointsPosition);
  transform.rotation.copy(waypointsRotation);
  updatePhpLogo();

  //uniforms.uProgress.value = sceneWeightsInOut.about.in * 1.1 - 0.1;
  uniforms.uProgress.value = aboutProgress.value * 1.1 - 0.1;
  uniforms.uAmbientStrength.value = sceneWeightsInOut.about.in;

  if (!mesh) return;
  if (uniforms.uProgress.value > 0.999 && sceneWeights.contact > 0.99) {
    mesh.visible = false;
  } else {
    mesh.visible = true;
  }
};

const updatePhpLogo = () => {
  if (!mesh || !phpLogo) return;

  const showLogo = sceneWeights.about > 0.15 && sceneWeights.contact < 0.001;
  phpLogo.visible = showLogo;
  if (!showLogo) return;

  transform.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);

  const avatarBox = new Box3().setFromObject(mesh);
  const avatarSize = new Vector3();
  const logoPosition = new Vector3();
  avatarBox.getSize(avatarSize);
  avatarBox.getCenter(logoPosition);

  logoPosition.x += avatarSize.x * 0.12;
  logoPosition.y = avatarBox.max.y + avatarSize.y * 0.35;
  logoPosition.z = avatarBox.max.z + avatarSize.z * 0.12;

  phpLogo.position.copy(logoPosition);
  phpLogo.rotation.set(Math.PI / 2, 0, 0);
};

const destroy = () => {
  //mesh = null;
  //transform.clear();
  face.destroy();
  gsap.ticker.remove(tick);

  phpLogo = null;
};

export const avatar = {
  init,
  destroy,
  getMesh: () => mesh,
  getRightHandBone: () => rightHandBone,
  tIdleIntensity,
  waypointsPosition,
  waypointsRotation,
  uniforms,
  transform,
};
