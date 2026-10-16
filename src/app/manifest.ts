import type { MetadataRoute } from "next";

// Makes the site installable ("Add to Home screen"): opens full-screen with
// the club icon, no browser bar. No offline support; it's a live club app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Morning Mile Club",
    short_name: "Morning Mile",
    description: "Let's run. Every Saturday from Gbagada General Hospital, 6:00 AM.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#101820",
    theme_color: "#101820",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
