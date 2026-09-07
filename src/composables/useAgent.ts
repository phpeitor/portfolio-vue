import { onMounted, ref } from "vue";

export const isTouch = ref(false);

export const useAgent = () => {
  onMounted(() => {
    // Prefer the primary pointer type: a coarse pointer means touch/stylus is the main
    // input. Falls back to touch-capability checks only when matchMedia is unavailable,
    // since maxTouchPoints/ontouchstart alone also flag touchscreen laptops that are
    // actually driven by a mouse, wrongly disabling sounds/cursor for those users.
    isTouch.value = window.matchMedia
      ? window.matchMedia("(pointer: coarse)").matches
      : "ontouchstart" in window || navigator.maxTouchPoints > 0;
  });

  return {
    isTouch,
  };
};
