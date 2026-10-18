import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Permanent_Marker } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Hand-painted headline face (page titles and big numbers), like a cheer
// sign at the finish. Everything else stays in Barlow for readability.
const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Morning Mile Club",
  description: "Let's run. Every Saturday, 6 AM, Lagos. ~12 km with the Morning Mile Club.",
  applicationName: "Morning Mile Club",
  // iPhone "Add to Home Screen": the page runs under a see-through status
  // bar (white clock on our navy header); headers pad by the safe area.
  appleWebApp: { capable: true, title: "Morning Mile", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#101820",
  // Lets env(safe-area-inset-*) report the notch / clock area on iPhones.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} ${permanentMarker.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
