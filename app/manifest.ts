import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Armonia",
    short_name: "Armonia",
    description: "Gestionale personale per logopediste",
    start_url: "/oggi",
    display: "standalone",
    background_color: "#f8faf7",
    theme_color: "#46654c",
    icons: [
      {
        src: "/branding/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
