# Portfolio Vue 🆚

[![forthebadge](https://forthebadge.com/badges/made-with-vue.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/badges/built-with-love.svg)](https://www.linkedin.com/in/drphp/)

<a href="https://www.instagram.com/amvsoft.tech/">
  <img src="https://assets.awwwards.com/awards/element/2022/04/62685b5d39137607918646.png" alt="Instagram" width="800">
</a>

Portfolio personal interactivo con secciones animadas, proyectos, audio, WebGL y escenas 3D. El sitio combina UI en Vue con una escena `three.js` que contiene habitación, avatar, laboratorio/contacto, modelos GLB, shaders GLSL, sonidos y transiciones controladas por scroll.

## Stack

- Vue 3 con `<script setup>`
- TypeScript
- Vite
- SCSS con mixins globales desde `src/assets/styles/mixins.scss`
- three.js para modelos, escenas, materiales, raycast y shaders
- GSAP para timelines, scroll y ticker
- Lenis para smooth scroll
- Howler para audio
- `vite-plugin-glsl` para importar shaders `.glsl`

## Requisitos

- Node.js compatible con Vite 7
- npm

El proyecto usa `type: "module"`, así que los scripts y módulos corren como ESM.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor corre en `http://localhost:3000` (configurado en `vite.config.ts` con `strictPort: true` y `host: true`, soporta assets `.glb`, `.gltf`, `.obj`, `.mtl`, imágenes, audio y shaders).

## Build y despliegue

```bash
npm run build
```

Genera el build de producción en `dist/`. En `dev.metadatape.com` el sitio se sirve como **static root** directo desde `dist/` vía nginx: **no hay paso de deploy aparte** — correr `npm run build` en el servidor actualiza el sitio en vivo de inmediato. No hay proceso separado de "publicar"; asegurarse de que el build pasa `typecheck` antes de dejarlo corriendo.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta Vite en desarrollo |
| `npm run typecheck` | Ejecuta `vue-tsc -b` |
| `npm run build` | Typecheck y build de producción en `dist/` (equivale a deploy en prod) |
| `npm run preview` | Sirve el build localmente |

## Estructura Principal

| Ruta | Uso |
| --- | --- |
| `src/main.ts` | Entrada de la app |
| `src/App.vue` | Composición principal |
| `src/components/` | Componentes UI reutilizables |
| `src/composables/` | Lógica reutilizable (router, scroll, tema del header, preloader, transiciones) |
| `src/features/` | Secciones de alto nivel del sitio (home, projects, sounds) |
| `src/content/` | Contenido de proyectos, previews, textos legales y social links |
| `src/i18n/` | Store y helpers de idioma (`es`/`en`) |
| `src/animations/` | Timelines, escenas, waypoints y transiciones |
| `src/three/` | Core WebGL, objetos 3D, materiales, shaders, raycast |
| `src/assets/` | Modelos, texturas, estilos, sonidos, videos e imágenes |
| `src/utils/` | Helpers compartidos (loader de recursos, sizes, eventos, math) |

> Nota: no existe carpeta `capturas/` en el repo pese a lo que decía una versión previa de este README — si se retoma la práctica de guardar capturas manuales de QA visual, documentarlo aquí de nuevo.

## Recursos 3D & Assets

Todos los recursos cargados por la experiencia WebGL se registran en `src/sources.ts`.

Modelos GLB registrados actualmente:

- `avatar-model`: `src/assets/models/avatar.glb`
- `room-model`: `src/assets/models/room.glb`
- `lab-model`: `src/assets/models/lab.glb`
- `contact-model`: `src/assets/models/contact.glb`
- `elephant-model`: `src/assets/elephant/demo.glb`
- `php-logo-model`: `src/assets/elephant/php.glb`
- `laptop-model`: `src/assets/glb/laptop.glb`
- `baby-elephant-model`: `src/assets/glb/baby_elephant.glb`

Esta lista puede quedar desactualizada — `src/sources.ts` es la fuente de verdad, revisar ahí antes de asumir qué está cargado.

El loader vive en `src/utils/resources.ts` y soporta:

- `gltfModel` con `GLTFLoader`
- `objModel` con `OBJLoader` y fallback de `.mtl`
- `texture` con `TextureLoader`

Los GLB comprimidos con meshopt requieren `MeshoptDecoder`, ya configurado en `src/utils/resources.ts`.

## Escenas WebGL

Las escenas se ponderan con `sceneWeights` y `sceneWeightsInOut` en `src/animations/scenes.ts`.

Estados principales:

- `hero`: habitación inicial con persona sentada
- `about`: transición a avatar/lab
- `about-1`: primer estado de About
- `about-2`: segundo estado de About
- `projects`: zona de proyectos
- `contact`: contacto

Los puntos de cámara para landscape/portrait están en `src/animations/waypoints-data.ts`.

## Objetos Importantes

- `src/three/objects/room/`: habitación, elementos interactivos, elefante de escritorio, elefante bebé animado (caminata), música, mouse, desktops.
- `src/three/objects/avatar/`: avatar, animaciones, face, accesorios (glasses), desktop izquierdo y logo PHP.
- `src/three/objects/lab/`: escena holográfica/laboratorio.
- `src/three/objects/contact/`: escena de contacto (incluye laptop como prop).

## Flujo Modelos GLB

1. Agregar el archivo en `src/assets/...`.
2. Importarlo en `src/sources.ts`.
3. Registrar el recurso con un nombre estable.
4. Usarlo desde `resources.items["nombre-del-recurso"]` después de que el loader esté listo.
5. **Si el modelo tiene skeleton/bones (rig animado), clonar siempre con `SkeletonUtils.clone(resource.scene)` — nunca `resource.scene.clone(true)`.** Un clone plano no relinquea el skinning al nuevo skeleton y el modelo renderiza invisible sin ningún error, sin importar que posición/escala estén correctas. Confirmar con `grep` si el GLB tiene `"skins"` en su JSON antes de escribir código.
6. Normalizar escala, centro y orientación con `Box3` antes de posicionarlo — si el modelo necesita rotación para corregir su orientación (ejes no estándar), aplicar la rotación **antes** de medir el `Box3`, nunca después, o el fit queda calculado sobre la forma equivocada.
7. Esta escena no tiene luces: cualquier material `MeshStandardMaterial`/PBR renderiza negro puro. Convertir a `MeshBasicMaterial` (conservando `.map`) para que sea visible, como ya hacen `laptop.ts` y `baby-elephant.ts`.
8. Si el modelo trae una animación de caminata/locomoción y el desplazamiento se controla por código (ej. GSAP), verificar que la animación no tenga ella misma una traslación grande baked-in en algún hueso intermedio — si la tiene, compite con el movimiento externo y se ve como saltos/teletransporte en vez de una caminata continua.
9. Ejecutar `npm run typecheck` y `npm run build`.

## Contenido de Proyectos

- Proyectos por idioma: `src/content/projects/{en,es}/<slug>.ts`
- Previews/listado: `src/content/projects/previews/`
- IDs y slugs: `src/content/projects/index.ts`
- Tags y variantes visuales: `src/components/tagVariants.ts`

Los slugs deben mantenerse consistentes entre previews, contenido y `projectIds`.

## Audio

Los sonidos y música están en `src/assets/sounds/` y `src/assets/music/`.

La lógica de audio usa Howler y utilidades bajo `src/features/sounds/`.

## Estilos

Los estilos globales viven en `src/assets/styles/`.

Vite inyecta automáticamente:

```scss
@use "/src/assets/styles/mixins.scss";
```

Por eso los componentes pueden usar mixins compartidos sin importar el archivo manualmente.

## Verificación de Cambios

```bash
npm run typecheck
npm run build
```

Para cambios visuales/WebGL, `npm run build` + revisar en navegador es obligatorio — typecheck y build verifican que el código compila, no que la escena se vea o se comporte correctamente. En este proyecto no basta con mutar objetos de Three.js en vivo desde devtools/consola para probar una posición o escala: en la práctica esas mutaciones no siempre se reflejan de forma confiable en lo renderizado. El ciclo que sí funciona es editar la constante en el código fuente → `npm run build` → recargar la página.

## Notas de Mantenimiento

- No modificar modelos/escenas a ciegas: revisar primero `src/sources.ts` y `src/three/objects/*` antes de tocar posiciones/escalas.
- Los modelos grandes impactan el bundle; preferir GLB optimizados.
- Para assets GLB externos, preferir modelos `Y-up`, centrados en origen y con escala razonable — algunos exportadores/conversores automáticos (ej. herramientas de imagen a STL) generan geometría con ejes no estándar (`Z-up`) sin avisarlo; si un modelo se ve girado/aplastado sin razón aparente, sospechar del eje antes que de la matemática de transformación.
- Si el GLB viene comprimido con meshopt, mantener `MeshoptDecoder` configurado.
- El diseño visual de los modelos debe coincidir con el estilo cartoon/low-poly del portfolio.