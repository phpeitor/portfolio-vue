import videoCubeWar from "../../../assets/videos/cubewar.mp4";

import cubewar0 from "../../../assets/images/projects/xintra/xintra-0.jpg";
import cubewar1 from "../../../assets/images/projects/xintra/xintra-1.jpg";
import cubewar2 from "../../../assets/images/projects/xintra/xintra-2.jpg";
import cubewar3 from "../../../assets/images/projects/xintra/xintra-3.jpg";
import cubewar4 from "../../../assets/images/projects/xintra/xintra-4.jpg";

import type { ProjectContent } from "../../types";

export default {
  title: "Xintra",
  theme: "dark",
  tags: ["three", "laravel", "websockets", "redis"],
  videoBorder: false,
  live: "https://sales.metadatape.com",
  description:
    "XINTRA Elephpant es una aplicación web completa para la gestión de tickets, clientes, usuarios e inventario con interfaz interactiva y animada. Desarrollada con Laravel, Three.js, WebSockets y Redis, ofrece una experiencia fluida y visualmente atractiva para la administración de servicios y productos.",
  components: [
    {
      type: "media",
      props: {
        type: "video",
        src: videoCubeWar,
        caption: "Demo",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: cubewar0,
        alt: "Dashboard",
        caption: "Dashboard",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: cubewar1,
        alt: "Ticket Management",
        caption: "Ticket Management",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: cubewar2,
        alt: "Sales Analytics",
        caption: "Sales Analytics",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: cubewar3,
        alt: "Responsives Design",
        caption: "Responsives Design",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: cubewar4,
        alt: "Calendar View",
        caption: "Calendar View",
      },
    },
  ],
} as const satisfies ProjectContent;
