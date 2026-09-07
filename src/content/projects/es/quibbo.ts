import videoQuibbo from "../../../assets/videos/quibbo.mp4";

import quibbo0 from "../../../assets/images/projects/elephpant/elephpant-0.jpg";
import quibbo1 from "../../../assets/images/projects/elephpant/elephpant-1.jpg";
import quibbo2 from "../../../assets/images/projects/elephpant/elephpant-2.jpg";
import quibbo3 from "../../../assets/images/projects/elephpant/elephpant-3.jpg";

import type { ProjectContent } from "../../types";

export default {
  title: "Elephpant",
  theme: "light",
  tags: ["three", "php", "kubernetes", "redis", "postgresql"],
  videoBorder: true,
  description:
    "Un juego tipo Flappy Bird basado en PHP-GLFW. Permite competir en partidas multijugador en tiempo real utilizando WebSockets y Redis para la gestión de sesiones y datos. Además, el proyecto está desplegado en un clúster de Kubernetes, demostrando la capacidad de PHP para aplicaciones modernas y escalables.",
  components: [
    {
      type: "media",
      props: {
        type: "video",
        src: videoQuibbo,
        caption: "Gameplay",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: quibbo0,
        alt: "Avatar Ersteller",
        caption: "Avatar Ersteller",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: quibbo1,
        alt: "Tic-Tac-Toe",
        caption: "Tic-Tac-Toe",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: quibbo2,
        alt: "Minispiele",
        caption: "Minispiele",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: quibbo3,
        alt: "Avatar Variationen",
        caption: "Avatar Variationen",
      },
    },
  ],
} as const satisfies ProjectContent;
