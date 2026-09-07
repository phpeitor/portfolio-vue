<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Plus from "./icons/Plus.vue";
import { lenis } from "../composables/useScroll";

interface Props {
  title: string;
}

defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") emit("close");
};

onMounted(() => {
  lenis.value?.stop();
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  lenis.value?.start();
  document.body.style.overflow = "";
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')" data-cursor="circle-white">
      <div class="modal" role="dialog" aria-modal="true" :aria-label="title">
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button
            type="button"
            class="modal-close children-unclickable"
            @click="emit('close')"
            aria-label="Close"
            data-cursor="circle-white"
            data-sound="click"
            data-hoversound="hover"
          >
            <Plus class="modal-close-icon" />
          </button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-index-modal);
  background-color: rgba(9, 20, 52, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-outer);
}

.modal {
  background-color: var(--color-background-300, var(--color-beige-400));
  color: var(--color-text-400);
  width: 100%;
  max-width: var(--breakpoint-md);
  max-height: calc(100dvh - var(--space-outer) * 2);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--color-grayscale-400);
    flex-shrink: 0;
  }

  &-title {
    font-size: var(--font-size-title-xs);
    line-height: var(--line-height-title);
  }

  &-close {
    --icon-color: var(--color-text-400);
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.1s ease-in-out;

    @include mixins.hover {
      &:hover {
        background-color: var(--color-grayscale-500);
      }
    }

    &-icon {
      width: 14px;
      transform: rotate(45deg);
    }
  }

  &-body {
    padding: var(--space-lg);
    overflow-y: auto;
    line-height: var(--line-height-copy);

    :deep(h1),
    :deep(h2),
    :deep(h3) {
      line-height: var(--line-height-title);
      margin-top: var(--space-lg);
      margin-bottom: var(--space-xs);

      &:first-child {
        margin-top: 0;
      }
    }

    :deep(h1) {
      font-size: var(--font-size-title-xxs);
    }

    :deep(h2) {
      font-size: var(--font-size-xl);
    }

    :deep(h3) {
      font-size: var(--font-size-lg);
    }

    :deep(p),
    :deep(ul) {
      margin-bottom: var(--space-sm);
    }

    :deep(ul) {
      list-style: disc;
      padding-left: var(--space-lg);
    }

    :deep(li) {
      margin-bottom: var(--space-xxs);

      &::marker {
        color: var(--color-text-400);
      }
    }

    :deep(a) {
      color: inherit;
      text-decoration: underline;
    }
  }
}
</style>
