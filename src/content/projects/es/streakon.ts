import streakon0 from "../../../assets/images/projects/cotix360/cotix360-0.jpg";
import streakon1 from "../../../assets/images/projects/cotix360/cotix360-1.jpg";
import streakon2 from "../../../assets/images/projects/cotix360/cotix360-2.jpg";
import streakon3 from "../../../assets/images/projects/cotix360/cotix360-3.jpg";

import type { ProjectContent } from "../../types";

export default {
  title: "Cotix360",
  theme: "dark",
  tags: ["next", "node", "mysql"],
  videoBorder: false,
  live: "https://mgindusol.com",
  description:
    "Aplicación web para gestión de usuarios, carga de ítems y generación de cotizaciones con cálculo automático de costos, flete, gastos, interés, factor y precios finales.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: streakon0,
        alt: "Login Animado Recaptcha",
        caption: "Login Animado Recaptcha",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: streakon1,
        alt: "Usuarios, Roles y Permisos",
        caption: "Usuarios, Roles y Permisos",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: streakon2,
        alt: "Gestión de Ítems y Cotizaciones",
        caption: "Gestión de Ítems y Cotizaciones",
      },
    },
    {
      type: "media",
      props: {
        type: "image",
        src: streakon3,
        alt: "Generación de Reportes",
        caption: "Generación de Reportes",
      },
    },
  ],
} as const satisfies ProjectContent;
