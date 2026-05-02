import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fantasix — R6 Siege Pick'Em",
    short_name: "Fantasix",
    description: "Predict match winners and climb the leaderboard at the BLAST R6 Major SLC 2026.",
    start_url: "/predictions",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07080D",
    theme_color: "#07080D",
    categories: ["sports", "games", "entertainment"],
    icons: [
      {
        src: "/api/icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icon?size=512&maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Predictions",
        short_name: "Picks",
        url: "/predictions",
        description: "Make match predictions",
      },
      {
        name: "Leaderboard",
        short_name: "Ranking",
        url: "/leaderboard",
        description: "View the global ranking",
      },
    ],
  }
}
