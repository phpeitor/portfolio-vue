import videoSharkie from "../../../assets/videos/sharkie.mp4";

import sharkie0 from "../../../assets/images/projects/motherday/motherday-0.jpg";
import sharkie1 from "../../../assets/images/projects/motherday/motherday-1.jpg";

import type { ProjectContent } from "../../types";

export default {
  title: "MotherDay",
  theme: "light",
  tags: ["javascript", "html", "css"],
  live: "https://ubuntux.metadatape.com/mothers-day",
  source: "https://github.com/phpeitor/mothers-day",
  description:
    "Landing page interactiva (Día de la Madre) con animaciones modernas, efectos de partículas y transiciones fluidas. Incluye múltiples secciones animadas y una experiencia visual reactiva.",
  components: [
    {
      type: "media",
      props: {
        type: "video",
        src: videoSharkie,
        caption: "Gameplay",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: sharkie0,
        alt: "Hearth-Karten-Design",
        caption: "Hearth-Karten-Design",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: sharkie1,
        alt: "Love-Animation",
        caption: "Love-Animation",
      },
    },
  ],
} as const satisfies ProjectContent;
