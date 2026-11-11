import Link from "next/link";
import { buttonClass, Card, Screen } from "@/components/ui";

// Broken links, typos and old QR codes land here instead of Next's plain page.
export default function NotFound() {
  return (
    <Screen eyebrow="Morning Mile Club" title="Wrong turn">
      <Card>
        <p className="font-display text-2xl font-bold uppercase leading-tight">This page isn&apos;t on the route</p>
        <p className="mt-2 text-navy/70">
          The link may be old or mistyped. If you were scanning in at the meetup, ask an organiser for today&apos;s QR code.
        </p>
        <Link href="/" className={`${buttonClass} mt-5`}>
          Back to home
        </Link>
      </Card>
    </Screen>
  );
}
