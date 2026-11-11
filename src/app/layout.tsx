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

const description = "Let's run. Every Saturday, 6 AM, Lagos. ~12 km with the Morning Mile Club.";

export const metadata: Metadata = {
  // Absolute base for link previews (opengraph-image.jpg in this folder).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://morning-mile-club.vercel.app"),
  title: "Morning Mile Club",
  description,
  applicationName: "Morning Mile Club",
  // WhatsApp, X and others read these for the link preview card.
  openGraph: { type: "website", siteName: "Morning Mile Club", title: "Morning Mile Club", description, locale: "en_NG" },
  twitter: { card: "summary_large_image" },
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
