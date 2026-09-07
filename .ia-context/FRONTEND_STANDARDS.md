# Estándares de Código Frontend

Cómo escribir código nuevo en este proyecto para que sea indistinguible del código existente. Para entender *por qué* el proyecto está armado así, ver [`FRONTEND_ARQUITECTURA.md`](./FRONTEND_ARQUITECTURA.md). Para reglas de identidad visual/WebGL, ver [`FRONTEND_RULES.md`](./FRONTEND_RULES.md).

## 1. Principios generales

- TypeScript `strict` está activo (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`). No introducir `any` salvo un caso ya existente y justificado (ej. `items: Record<string, any>` en `resources.ts` porque mezcla `Texture | GLTF | Group`); si se necesita, documentarlo con un comentario breve del porqué.
- No agregar dependencias nuevas (routing, store, i18n, animación) sin acordarlo antes: el proyecto ya resuelve routing, estado global e i18n con patrones propios (ver arquitectura §4, §5, §11). Una librería nueva para lo mismo es redundancia, no mejora.
- Componentes y composables pequeños y de una responsabilidad. Si un componente supera ~150–200 líneas de `<script>`, evaluar si conviene partirlo en sub-componentes o extraer un composable — pero no dividir preventivamente si no hay señal real de que estorba.
- No dejar código comentado "por si acaso" salvo que ya sea el estilo del archivo (hay algunos `//import X` deshabilitados temporalmente en `App.vue`/`Home.vue` — evitar sumar más; si algo se apaga, usar `isFeatureEnabled()` en vez de comentar imports).

## 2. Componentes Vue

- Siempre `<script setup lang="ts">`. Orden de bloques: `<script setup>` → `<template>` → `<style scoped lang="scss">`.
- Props tipadas con `interface Props { ... }` + `const props = defineProps<Props>()`. Cuando otro componente necesita extender o reusar esas props, **exportar la interfaz** (`export interface Props`) e importarla con `import type { Props as XProps } from "./X.vue"` — patrón real en `Button.vue` (`extends ButtonWrapperProps`) y en `features/projects/types.ts` (`ImageTextProps`, `TextProps`, etc.).
- Preferir composición sobre herencia de comportamiento: un componente "grande" envuelve a uno "base" y le pasa `v-bind="props"` (`Button.vue` envolviendo `ButtonWrapper.vue`) en vez de duplicar lógica.
- `computed()` para clases condicionales complejas (objeto o array), no concatenación de strings a mano. Ver `classNames`/`getInTouchClassNames` en `Header.vue`.
- Nombres de archivo de componentes en `PascalCase.vue`. Un componente por archivo. Iconos SVG viven en `src/components/icons/` como componentes Vue individuales (no un sprite sheet único, salvo los ya usados en 3D).

## 3. Composables y estado

- Nombre siempre `useX.ts`, función exportada `useX()`.
- **Patrón de singleton reactivo por módulo** (ver arquitectura §5): si el estado debe compartirse entre componentes no relacionados por props (ruta actual, locale, si está sonando música, si el usuario es touch), se declara como `ref`/`computed` **a nivel de módulo**, fuera de la función `useX()`. La función `useX()` solo conecta ciclo de vida (`onMounted`, `watch`, listeners) y puede devolver ese mismo estado para conveniencia del primer consumidor.
- Si el estado es realmente local a un componente (un toggle de UI, un flag de hover puntual), usar `ref()` normal dentro del `<script setup>` del componente — no todo necesita ser un composable ni un singleton.
- No crear un composable nuevo si el estado ya existe en otro (revisar `src/composables/` y `src/i18n/store.ts` antes de declarar un `ref` global nuevo).
- Composables que agregan listeners globales (`window`, `document`) deben limpiar en `onUnmounted`/`onBeforeUnmount` — sin excepciones, es el patrón en absolutamente todos los composables existentes (`useScroll`, `useRouteObserver`, `useClickSounds`, `Cursor.vue`, `raycast.ts`).

## 4. TypeScript

- Imports de tipos siempre explícitos: `import type { Foo } from "..."`, separados de los imports de valores (ver cualquier archivo de `features/projects/`).
- Para arrays/objetos de configuración que deben inferir tipos literales, usar `as const satisfies T[]` (patrón de `sources.ts`), no `as T[]` a secas.
- Discriminated unions para variantes de contenido/props (patrón `ProjectComponent` en `features/projects/types.ts`) en vez de un objeto con muchos campos opcionales.
- No usar imports con alias de path (`@/...`): el proyecto no tiene configurado `paths` en `tsconfig` — todos los imports son relativos. No agregar un alias sin actualizar `tsconfig.app.json` y `vite.config.ts` a la vez, y sin acordarlo antes (reescribiría imports en todo el repo).

## 5. SCSS y estilos

- Un `<style scoped lang="scss">` por componente. Estilos globales solo en `src/assets/styles/` (`index.scss`, `reset.scss`, etc.) y en el bloque no-scoped de `App.vue` (wrappers de layout que cruzan componentes).
- Nesting tipo BEM con `&`: bloque en la clase raíz, elementos/modificadores con `&-elemento`/`&-modificador` (ver `Header.vue`, `Button.vue`, `Cursor.vue`). No usar selectores de descendiente sueltos (`.a .b {}`) si se puede anidar con `&`.
- Todos los valores de layout/espaciado/color salen de las custom properties definidas en `variables.scss`/`colors.scss` (`var(--space-md)`, `var(--radius-lg)`, `var(--color-white-400)`, `var(--z-index-header)`). No hardcodear un `px`/color nuevo si ya existe un token equivalente; si no existe, agregarlo a `variables.scss`/`colors.scss` en vez de inventarlo inline.
- Breakpoints: **siempre** `@include mixins.mq("sm"|"md"|"lg"|"xl"|"xxl"|"xxxl")`, mobile-first (`min-width` es la dirección por defecto). No escribir `@media (min-width: 840px)` a mano — usar la key del breakpoint (`md`).
- Estados hover-only (para no aplicar hover en touch): `@include mixins.hover { &:hover { ... } }`, no `&:hover` suelto si el efecto no debe verse en touch.
- Los mixins están disponibles automáticamente en todo `.scss` vía `additionalData` de Vite (`vite.config.ts`) — no hacer `@use "../mixins"` manual en cada componente.

## 6. Convenciones de interacción declarativa (`data-*`)

El proyecto conecta audio y cursor a los elementos por **atributos de datos leídos por listeners globales**, no por handlers imperativos por componente (ver arquitectura §13–14):

- `data-sound="<key>"` → sonido al click, resuelto por `useClickSound()` vía delegación en `document.body`. `<key>` debe existir en `features/sounds/definitions/sounds.ts`.
- `data-hoversound="<key>"` → sonido al hover (equivalente para hover, `useHoverSounds.ts`).
- `data-cursor="circle-black" | "circle-white" | "arrow" | "arrow-external"` → forma del cursor custom mientras el puntero está sobre ese elemento o sus hijos.

Al agregar un elemento clickeable/hovereable nuevo, usar estos atributos en vez de escribir `@click="playSound(...)"` o `cursor: pointer` manual. Para objetos 3D interactivos, el equivalente es un `ClickableBox3` con `onClick`/`hoverSound` agregado a `raycast.boxesToCheck` (ver `FRONTEND_RULES.md`).

## 7. i18n

- Ningún string de UI (labels, aria-labels, botones) hardcodeado en un componente: usar `t("key")` de `src/i18n/utils/translate.ts`.
- Al agregar una key nueva, agregarla en **todos** los locales soportados en el mismo cambio (`messages/namespaces/common/en.json` y `.../es.json`) — nunca dejar un idioma sin la key aunque el default (`en`) la resuelva.
- El contenido de proyectos (`content/projects/{en,es}/*`) no pasa por `t()`: es contenido largo por idioma, ya separado por carpeta de locale. No mezclar los dos sistemas.

## 8. Feature flags

- Funcionalidad opcional o experimental se envuelve con `isFeatureEnabled("key")` (`src/utils/features.ts`), no con un comentario `// deshabilitado`. Si se agrega un flag nuevo, agregarlo al objeto `features` con un nombre descriptivo — no reusar uno existente para algo no relacionado.

## 9. Formato y calidad antes de entregar

- Prettier (`.prettierrc`): comillas dobles, `semi: true`, `printWidth: 120`. Correr `npx prettier --write` sobre los archivos tocados si el editor no lo hace solo.
- Antes de dar por cerrado un cambio:
  1. `npm run typecheck` (equivalente a lo que corre `npm run build` antes de Vite).
  2. `npm run build`.
  3. Revisión visual en `http://localhost:3000` (desktop, y mobile si el cambio toca layout/cámara/scroll).
  4. Sin errores nuevos en consola del navegador.

## 10. Qué evitar

- No introducir Pinia/Vuex, `vue-router` ni `vue-i18n` — duplicarían mecanismos ya resueltos (§ arquitectura 4, 5, 11) y fragmentarían el estado en dos sistemas paralelos.
- No crear un segundo loop de animación (`requestAnimationFrame` propio): todo tick nuevo se agrega a `gsap.ticker` (ver arquitectura §9).
- No leer/escribir `localStorage` fuera de los composables que ya lo hacen (`i18n`) sin evaluar si el dato debería vivir como singleton reactivo en vez de en storage disperso.
- No duplicar un mixin, color o breakpoint que ya existe con otro nombre "por las dudas".
- No usar `!important` salvo que ya sea el patrón local (existe algún caso puntual documentado en el propio archivo; no generalizarlo).
