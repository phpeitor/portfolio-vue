import videoPokedex from "../../../assets/videos/pokedex.mp4";

import pokedex0 from "../../../assets/images/projects/kindervianney/kindervianney-0.jpg";
import pokedex1 from "../../../assets/images/projects/kindervianney/kindervianney-1.jpg";
import pokedex2 from "../../../assets/images/projects/kindervianney/kindervianney-2.jpg";

import type { ProjectContent } from "../../types";

export default {
  title: "Kinder",
  theme: "light",
  tags: ["php", "javascript", "postgresql", "css"],
  live: "https://institucioneducativavianney.com",
  source: "https://github.com/phpeitor/kinder-vianney",
  videoBorder: true,
  description:
    "Sitio web institucional para I.E.P San Juan Maria Vianney con portada responsive, slider visual, secciones informativas, portafolio, datos de contacto y formulario de Libro de Reclamaciones, desarrollado con Filament, PHP, CSS y JavaScript para una experiencia interactiva y atractiva.",
  components: [
    {
      type: "media",
      props: {
        type: "video",
        src: videoPokedex,
        caption: "Kinder Demo",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: pokedex0,
        alt: "Standard View",
        caption: "Standard View",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: pokedex1,
        alt: "Search Functionality",
        caption: "Search Functionality",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: pokedex2,
        alt: "Responsives Design",
        caption: "Responsives Design",
      },
    },
  ],
} as const satisfies ProjectContent;
