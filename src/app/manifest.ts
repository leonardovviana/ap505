import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Junto$",
    short_name: "Junto$",
    description: "Junto$, finanças em dupla sem drama.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#F7F8FA",
    theme_color: "#1DB954",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
