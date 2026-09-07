import { Group, Mesh, ShapeGeometry } from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

import type { Material } from "three";

// Same path data as #logo-path in index.html (the header brand mark) — reused here
// instead of a raster/texture so it stays crisp at any distance, and so it can take
// a plain solid-color material like the rest of these accessories.
const LOGO_PATH_D =
  "M3 14 24 2C28 0 28 0 32 2L53 14C56 16 56 17 56 19L56 43C56 46 55 47 51 49L32 59C28 61 28 61 24 59L5 49C1 47 0 46 0 43L0 19C0 17 0 16 3 14M28 4 5 17 28 28 51 17 28 4M53 20 30 31 30 56 53 44 53 20M40 42 33 35C33 35 32 34 33 33 34 32 35 33 36 34L36 34 43 41C44 42 44 42 43 43L35 51C35 51 34 52 33 51 32 50 33 49 33 49L40 42M16 42 23 35C23 35 24 34 23 33 22 32 21 33 20 34L13 41C12 42 12 42 13 43L21 51C21 51 22 52 23 51 24 50 23 49 23 49L16 42";

// Builds the logo as flat vector geometry (parsed straight from the path data, not a
// texture) so it can use a plain solid-color material like the rest of these
// accessories. Returned ungrouped/uncentered — callers position and scale it, same
// as attachPhpLogo does with the loaded GLB.
export const createSiteLogo = (material: Material): Group => {
  const svgData = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${LOGO_PATH_D}"/></svg>`);

  const group = new Group();
  group.name = "site-logo";

  for (const path of svgData.paths) {
    for (const shape of SVGLoader.createShapes(path)) {
      const mesh = new Mesh(new ShapeGeometry(shape), material);
      mesh.frustumCulled = false;
      // Body materials (including the crossed arms right in front of the chest in
      // the contact pose) are transparent too, with renderOrder 24 — without a
      // higher renderOrder here, they simply paint over this every frame regardless
      // of depthTest, since paint order (not depth) decides who wins within the
      // transparent queue at the same depth-test setting.
      mesh.renderOrder = 40;
      group.add(mesh);
    }
  }

  // SVG authoring space has Y pointing down; everything else here is Y-up.
  group.scale.y = -1;

  return group;
};
