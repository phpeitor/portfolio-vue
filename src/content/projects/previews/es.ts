import thumbnailCubeWar from "../../../assets/thumbnails/xintra.jpg";
import thumbnailQuibbo from "../../../assets/thumbnails/elephpant.jpg";
//import thumbnailParticles from "../../../assets/thumbnails/particles.webp";
import thumbnailPokedex from "../../../assets/thumbnails/kindervianney.jpg";
import thumbnailSharkie from "../../../assets/thumbnails/motherday.jpg";
import thumbnailStreakon from "../../../assets/thumbnails/cotix360.jpg";

import type { ProjectPreview } from "../../types";

export default [
  {
    title: "Cotix360",
    slug: "cotix360",
    thumbnail: thumbnailStreakon,
    description: "App Cotizaciones",
  },
  {
    title: "Xintra",
    slug: "xintra",
    thumbnail: thumbnailCubeWar,
    description: "TicketWeb-App",
  },
  {
    title: "Elephpant",
    slug: "elephpant",
    thumbnail: thumbnailQuibbo,
    description: "Multiplayer-Gaming-Plattform",
  },
  {
    title: "MotherDay",
    slug: "motherday",
    thumbnail: thumbnailSharkie,
    description: "Interactive Landingpage",
  },
  /**  {
    title: "WebGL Partikel",
    slug: "particles",
    thumbnail: thumbnailParticles,
    description: "Dynamische 3D Partikel",
  }, */
  {
    title: "KinderVianney",
    slug: "kindervianney",
    thumbnail: thumbnailPokedex,
    description: "Open-Source School",
  },
] as const satisfies ProjectPreview[];
