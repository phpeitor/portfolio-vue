<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NotchSection from "../../../components/NotchSection.vue";
import Banner from "../../../components/Banner.vue";
import { t } from "../../../i18n/utils/translate";
import { locale } from "../../../i18n/store";
import { lenis } from "../../../composables/useScroll";
import { prefersReducedMotion } from "../../../utils/motion";
import { eras, timeline, type Era } from "../../../content/php-timeline";
import { createTimelineElephpant, type TimelineElephpant } from "../timeline/timeline-elephpant";

// "My journey with PHP": a pinned, scroll-driven timeline from PHP 5.4 (where I
// started, at university) to 8.5. Scrolling moves the elePHPant along the track; each
// stop swaps the era card (what I was doing then) and the code window, which shows the
// same kind of code written in that version's style with the new syntax highlighted.

gsap.registerPlugin(ScrollTrigger);

const STOPS = timeline.length;
const MIN_SPACING = 72; // px between stops before the rail starts scrolling sideways
const RAIL_PAD = 36; // keeps the first/last labels inside the track

const sectionRef = ref<HTMLElement | null>(null);
const trackRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const progress = ref(0);
const trackWidth = ref(0);
const elephantX = ref(0); // eased by the elephant itself, read back each frame

let trigger: ScrollTrigger | null = null;
let visibilityTrigger: ScrollTrigger | null = null;
let elephpant: TimelineElephpant | null = null;
let resizeObserver: ResizeObserver | null = null;

const lang = computed(() => (locale.value === "es" ? "es" : "en"));
const active = computed(() => Math.round(progress.value * (STOPS - 1)));
const stop = computed(() => timeline[active.value]!);

const usable = computed(() => Math.max(0, trackWidth.value - RAIL_PAD * 2));
const spacing = computed(() => Math.max(MIN_SPACING, usable.value / (STOPS - 1)));
const railWidth = computed(() => spacing.value * (STOPS - 1));
// On narrow screens the rail is wider than the track: slide it so the elephant stays
// near the middle.
const railOffset = computed(() => {
  const overflow = railWidth.value - usable.value;
  if (overflow <= 0) return 0;
  return Math.min(overflow, Math.max(0, elephantX.value - usable.value / 2));
});

// Era bands under the rail: one per run of consecutive stops in the same era.
const bands = computed(() => {
  const list: { era: Era; from: number; to: number }[] = [];
  timeline.forEach((s, i) => {
    const last = list[list.length - 1];
    if (last && last.era === s.era) last.to = i;
    else list.push({ era: s.era, from: i, to: i });
  });
  return list.map((b) => ({
    ...b,
    label: eras[b.era].label[lang.value],
    color: eras[b.era].color,
    left: b.from * spacing.value - spacing.value * 0.42,
    width: (b.to - b.from) * spacing.value + spacing.value * 0.84,
  }));
});

const era = computed(() => eras[stop.value.era]);

// Small PHP highlighter for the code window (escaped first, then tokens wrapped).
const KEYWORDS =
  "namespace|use|class|enum|case|extends|public|private|protected|readonly|final|const|function|fn|return|new|static|void|true|false|null|if|while|foreach|as|match|default|clone|require|include|echo|yield|set|defined|or|die";
const TOKEN_RE = new RegExp(
  `(\\/\\/.*$|\\/\\*.*?\\*\\/)|('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")|(\\$\\w+)|(<\\?php|#\\[[^\\]]*\\])|\\b(${KEYWORDS})\\b|(\\b\\w+(?=\\s*\\())|(\\b[A-Z]\\w*)|(\\b\\d+(?:\\.\\d+)?\\b)|(\\|>|\\?->|\\?\\?=?|<=>|=>|\\.\\.\\.)`,
  "g",
);
const CLASSES = ["c", "s", "v", "k", "k", "f", "t", "n", "o"];
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const highlight = (line: string) => {
  let html = "";
  let last = 0;
  for (const m of line.matchAll(TOKEN_RE)) {
    const index = m.index ?? 0;
    html += escapeHtml(line.slice(last, index));
    const group = m.slice(1).findIndex((g) => g !== undefined);
    html += `<span class="tk-${CLASSES[group] ?? "x"}">${escapeHtml(m[0])}</span>`;
    last = index + m[0].length;
  }
  return html + escapeHtml(line.slice(last)) || "&nbsp;";
};

const codeLines = computed(() =>
  stop.value.code.split("\n").map((text, i) => ({ html: highlight(text), hl: stop.value.hl.includes(i) })),
);

const goTo = (index: number) => {
  if (!trigger) return;
  const y = trigger.start + (trigger.end - trigger.start) * (index / (STOPS - 1));
  lenis.value ? lenis.value.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: "smooth" });
};

const measure = () => {
  trackWidth.value = trackRef.value?.clientWidth ?? 0;
  elephpant?.resize();
};

// Elephant x along the rail follows the scroll progress; it eases there itself and
// we read its position back every frame for the canvas and the rail offset.
const tick = () => {
  if (!elephpant) return;
  elephpant.setTarget(progress.value * railWidth.value, progress.value > 0.995);
  elephantX.value = elephpant.getPosition();
};

onMounted(() => {
  if (!sectionRef.value || !canvasRef.value) return;
  measure();
  resizeObserver = new ResizeObserver(measure);
  if (trackRef.value) resizeObserver.observe(trackRef.value);

  elephpant = createTimelineElephpant(canvasRef.value, () => prefersReducedMotion.value);
  elephpant.init();

  // Drives the progress while the stage is pinned.
  trigger = ScrollTrigger.create({
    trigger: sectionRef.value,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => (progress.value = self.progress),
    onRefresh: (self) => (progress.value = self.progress),
  });
  // The elephant renders whenever any part of the section is on screen.
  visibilityTrigger = ScrollTrigger.create({
    trigger: sectionRef.value,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => elephpant?.setVisible(self.isActive),
    onRefresh: (self) => elephpant?.setVisible(self.isActive),
  });
  gsap.ticker.add(tick);
});

onUnmounted(() => {
  gsap.ticker.remove(tick);
  trigger?.kill();
  trigger = null;
  visibilityTrigger?.kill();
  visibilityTrigger = null;
  resizeObserver?.disconnect();
  elephpant?.destroy();
  elephpant = null;
});
</script>

<template>
  <section ref="sectionRef" class="php-timeline" :style="{ '--stops': STOPS }">
    <NotchSection class="php-timeline-notch" />
    <div class="php-timeline-sticky">
      <div class="php-timeline-head">
        <div class="php-timeline-title">
          <Banner class="php-timeline-title-banner" :copy="t('php-journey-banner')" size="sm" animated />
          <h2 class="php-timeline-title-copy">{{ t("php-journey") }}</h2>
        </div>
        <p class="php-timeline-lead">{{ t("php-journey-lead") }}</p>
      </div>

      <div ref="trackRef" class="php-timeline-track">
        <canvas
          ref="canvasRef"
          class="php-timeline-elephpant"
          aria-hidden="true"
          :style="{ transform: `translateX(${RAIL_PAD + elephantX - railOffset}px) translateX(-50%)` }"
        ></canvas>
        <div class="php-timeline-rail" :style="{ width: `${railWidth}px`, transform: `translateX(${RAIL_PAD - railOffset}px)` }">
          <div class="php-timeline-line"></div>
          <div class="php-timeline-line-fill" :style="{ width: `${elephantX}px` }"></div>
          <button
            v-for="(s, i) in timeline"
            :key="s.version"
            type="button"
            class="php-timeline-node"
            :class="{ 'is-active': i === active, 'is-past': i < active }"
            :style="{ left: `${i * spacing}px` }"
            :aria-label="t('php-journey-go-to', { version: s.version })"
            :aria-current="i === active ? 'step' : undefined"
            @click="goTo(i)"
          >
            <span class="php-timeline-node-dot"></span>
            <span class="php-timeline-node-version">{{ s.version }}</span>
            <span class="php-timeline-node-year">{{ s.year }}</span>
          </button>
          <div
            v-for="b in bands"
            :key="b.from"
            class="php-timeline-band"
            :class="{ 'is-active': active >= b.from && active <= b.to }"
            :style="{ left: `${b.left}px`, width: `${b.width}px`, '--band': b.color }"
          >
            <span>{{ b.label }}</span>
          </div>
        </div>
      </div>

      <div class="php-timeline-body">
        <Transition name="tl-card" mode="out-in">
          <article :key="active" class="php-timeline-card" :style="{ '--era': era.color }">
            <span class="php-timeline-card-watermark" aria-hidden="true">{{ stop.version }}</span>
            <span class="php-timeline-card-era">{{ era.label[lang] }}</span>
            <div class="php-timeline-card-version">
              <span class="php-timeline-card-php">PHP</span>
              <strong>{{ stop.version }}</strong>
              <span class="php-timeline-card-year">{{ stop.year }}</span>
            </div>
            <p class="php-timeline-card-story">{{ stop.story[lang] }}</p>
            <div class="php-timeline-card-features">
              <span class="php-timeline-card-features-title">{{ t("php-journey-new") }}</span>
              <ul>
                <li v-for="f in stop.features" :key="f">{{ f }}</li>
              </ul>
            </div>
          </article>
        </Transition>

        <div class="php-timeline-code">
          <div class="php-timeline-code-bar">
            <span class="php-timeline-code-dots"><i></i><i></i><i></i></span>
            <span class="php-timeline-code-file">{{ stop.file }}</span>
            <span class="php-timeline-code-badge">PHP {{ stop.version }}</span>
          </div>
          <Transition name="tl-code" mode="out-in">
            <pre :key="active" class="php-timeline-code-pre"><code><span
              v-for="(line, i) in codeLines"
              :key="i"
              class="php-timeline-code-line"
              :class="{ 'is-new': line.hl }"
              :style="{ '--i': i }"
            ><span class="php-timeline-code-ln">{{ i + 1 }}</span><span v-html="line.html"></span></span></code></pre>
          </Transition>
        </div>
      </div>

      <div class="php-timeline-hint" :class="{ 'is-hidden': progress > 0.03 }">{{ t("php-journey-scroll") }} ↓</div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.php-timeline {
  --php: #8892bf;
  --php-dark: #4f5b93;
  --code-bg: #24262d;
  position: relative;
  width: 100%;
  // One screen of pinned stage, plus ~45% of a screen of scroll per stop.
  height: calc(var(--lvh) * (100 + var(--stops) * 45));
  background-color: var(--color-beige-400);

  &-notch {
    position: absolute;
    top: 0;
    left: 0;
    transform: translateY(-100%);
    color: var(--color-beige-400);
    --icon-color: var(--color-beige-400);
  }

  &-sticky {
    position: sticky;
    top: 0;
    height: calc(var(--lvh) * 100);
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 76px var(--space-outer) 20px;
    max-width: 1440px;
    margin: 0 auto;
    overflow: hidden;

    @include mixins.mq("md") {
      padding-top: 104px;
      gap: 22px;
    }
  }

  &-head {
    display: flex;
    flex-direction: column;
    gap: 10px;

    @include mixins.mq("lg") {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-xl);
    }
  }

  &-title {
    position: relative;
    padding-top: var(--space-md);

    &-copy {
      font-weight: 900;
      letter-spacing: 0.02em;
      line-height: 1;
      font-size: var(--font-size-title-sm);

      @include mixins.mq("sm") {
        font-size: var(--font-size-title-md);
      }

      @include mixins.mq("xl") {
        font-size: var(--font-size-title-lg);
      }
    }

    &-banner {
      position: absolute;
      top: 0;
      left: -8px;
      transform: translate(0, -30%) rotate(-4deg);
    }
  }

  &-lead {
    display: none;
    max-width: 460px;
    color: var(--color-text-300);
    font-size: var(--font-size-md);
    line-height: 1.5;

    @include mixins.mq("md") {
      display: block;
    }
  }

  // ---- Track -------------------------------------------------------------
  &-track {
    position: relative;
    flex: none;
    height: 150px;

    @include mixins.mq("md") {
      height: 186px;
    }
  }

  &-elephpant {
    position: absolute;
    left: 0;
    bottom: 60px; // feet just above the line and its dots
    width: 112px;
    height: 92px;
    pointer-events: none;
    z-index: 2;

    @include mixins.mq("md") {
      bottom: 60px;
      width: 150px;
      height: 124px;
    }
  }

  &-rail {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 86px;
  }

  &-line,
  &-line-fill {
    position: absolute;
    left: 0;
    top: 6px;
    height: 4px;
    border-radius: 2px;
  }

  &-line {
    width: 100%;
    background: var(--color-beige-700);
  }

  &-line-fill {
    background: linear-gradient(90deg, var(--php), var(--php-dark));
  }

  &-node {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 6px;
    background: none;
    border: 0;
    cursor: pointer;
    font-family: var(--font-mono);
    color: var(--color-text-300);

    &-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--color-beige-400);
      border: 3px solid var(--color-beige-700);
      transition:
        transform 0.3s ease,
        background-color 0.3s ease,
        border-color 0.3s ease;
    }

    &-version {
      font-size: 13px;
      font-weight: 700;
      transition: color 0.3s ease;
    }

    &-year {
      font-size: 10px;
      opacity: 0.75;
    }

    &.is-past &-dot {
      background: var(--php);
      border-color: var(--php);
    }

    &.is-active &-dot {
      background: var(--color-orange-400);
      border-color: var(--color-white-400);
      transform: scale(1.35);
      box-shadow: 0 0 0 4px rgba(255, 132, 0, 0.25);
    }

    &.is-active &-version {
      color: var(--color-text-400);
    }

    &:focus-visible {
      outline: 2px solid var(--color-orange-400);
      outline-offset: 2px;
      border-radius: 6px;
    }
  }

  &-band {
    position: absolute;
    bottom: 4px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: color-mix(in srgb, var(--band) 14%, transparent);
    color: var(--band);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    transition:
      background-color 0.3s ease,
      color 0.3s ease;

    &.is-active {
      background: var(--band);
      color: var(--color-white-400);
    }
  }

  // ---- Card + code -------------------------------------------------------
  &-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 12px;

    @include mixins.mq("lg") {
      grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
      grid-template-rows: auto;
      align-items: start;
      gap: var(--space-xl);
    }
  }

  &-card {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;

    @include mixins.mq("md") {
      gap: 14px;
    }

    // The version, huge and faint, behind the card.
    &-watermark {
      position: absolute;
      right: 0;
      top: -12px;
      z-index: -1;
      font-weight: 900;
      font-size: 120px;
      line-height: 1;
      color: color-mix(in srgb, var(--era) 9%, transparent);
      pointer-events: none;
      user-select: none;

      @include mixins.mq("md") {
        font-size: 220px;
      }
    }

    &-era {
      align-self: flex-start;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--era);
      color: var(--color-white-400);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    &-version {
      display: flex;
      align-items: baseline;
      gap: 10px;
      line-height: 1;

      strong {
        font-weight: 900;
        font-size: 44px;
        color: var(--php-dark);

        @include mixins.mq("md") {
          font-size: 72px;
        }
      }
    }

    &-php {
      font-weight: 900;
      font-size: 20px;
      font-style: italic;
      color: var(--php);

      @include mixins.mq("md") {
        font-size: 28px;
      }
    }

    &-year {
      font-family: var(--font-mono);
      font-size: 14px;
      color: var(--color-text-300);
    }

    &-story {
      font-size: 14px;
      line-height: 1.5;
      max-width: 560px;

      @include mixins.mq("md") {
        font-size: 17px;
      }
    }

    &-features {
      display: none;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;

      @include mixins.mq("md") {
        display: flex;
      }

      &-title {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--color-text-300);
      }

      ul {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      li {
        padding: 3px 9px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--php) 18%, transparent);
        color: var(--php-dark);
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 600;
      }
    }
  }

  &-code {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-radius: var(--radius-lg);
    background: var(--code-bg);
    box-shadow: 0 18px 40px rgba(45, 42, 36, 0.22);
    overflow: hidden;

    &-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #1c1e23;
      font-family: var(--font-mono);
      font-size: 12px;
      color: #9aa1ad;
    }

    &-dots {
      display: flex;
      gap: 6px;

      i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ff5f57;

        &:nth-child(2) {
          background: #febc2e;
        }

        &:nth-child(3) {
          background: #28c840;
        }
      }
    }

    &-file {
      flex: 1;
      color: #e6e6e6;
    }

    &-badge {
      padding: 2px 8px;
      border-radius: 6px;
      background: var(--php);
      color: #1e1f24;
      font-weight: 700;
    }

    &-pre {
      margin: 0;
      padding: 12px 0;
      overflow: hidden;
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 1.6;
      color: #abb2bf;

      @include mixins.mq("md") {
        font-size: 14px;
        padding: 18px 0;
      }

      code {
        display: block;
      }
    }

    &-line {
      display: block;
      padding: 0 14px 0 0;
      white-space: pre;
      border-left: 3px solid transparent;
      animation: tl-line-in 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      animation-delay: calc(var(--i) * 35ms);

      &.is-new {
        background: rgba(136, 146, 191, 0.16);
        border-left-color: var(--php);
      }
    }

    &-ln {
      display: inline-block;
      width: 36px;
      padding-right: 12px;
      text-align: right;
      color: #4b5263;
      user-select: none;
    }
  }

  &-hint {
    position: absolute;
    left: var(--space-outer);
    bottom: 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-300);
    transition: opacity 0.4s ease;

    &.is-hidden {
      opacity: 0;
    }
  }
}

// Syntax colours (One Dark, like the monitor in the room).
.php-timeline-code-pre :deep(.tk-c) {
  color: #7f848e;
  font-style: italic;
}
.php-timeline-code-pre :deep(.tk-s) {
  color: #98c379;
}
.php-timeline-code-pre :deep(.tk-v) {
  color: #e06c75;
}
.php-timeline-code-pre :deep(.tk-k) {
  color: #c678dd;
}
.php-timeline-code-pre :deep(.tk-f) {
  color: #61afef;
}
.php-timeline-code-pre :deep(.tk-t) {
  color: #e5c07b;
}
.php-timeline-code-pre :deep(.tk-n) {
  color: #d19a66;
}
.php-timeline-code-pre :deep(.tk-o) {
  color: #56b6c2;
  font-weight: 700;
}

@keyframes tl-line-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.tl-card-enter-active,
.tl-card-leave-active,
.tl-code-enter-active,
.tl-code-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.tl-card-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.tl-card-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.tl-code-enter-from,
.tl-code-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .php-timeline-code-line {
    animation: none;
  }

  .tl-card-enter-active,
  .tl-card-leave-active,
  .tl-code-enter-active,
  .tl-code-leave-active {
    transition: none;
  }
}
</style>
