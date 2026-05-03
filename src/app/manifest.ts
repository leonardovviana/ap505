import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gastos do casal",
    short_name: "Casal",
    description: "Gastos do casal, sem drama.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#F7F8FA",
    theme_color: "#1DB954",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
