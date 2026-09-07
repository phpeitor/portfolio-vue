import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from "three";
import vertexShader from "../../shaders/accessory-hologram/vertex.glsl";
import fragmentShader from "../../shaders/accessory-hologram/fragment.glsl";

// Same look as hologram-material.ts (the avatar's own "revealed when dissolved"
// double), minus the skinning chunks that material hard-requires — for rigid
// (non-skinned) accessories like glasses or the chest logo. Each accessory gets its
// own instance since uProgress/uTime get written every tick from a different anchor.
export const createAccessoryHologramMaterial = () =>
  new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color("rgb(0, 234, 255)") },
      uProgress: { value: 0 },
    },
  });
