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
  description: "Let's run. Every Saturday from Gbagada General Hospital, 6:00 AM, ~12 km.",
};

export const viewport: Viewport = {
  themeColor: "#101820",
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
