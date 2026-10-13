import { Card, Screen } from "@/components/ui";
import { Scanner } from "./scanner";

// In-app QR scanner. Login is checked on the check-in page it opens, so a
// signed-out member still lands back on check-in after logging in.
export default function ScanPage() {
  return (
    <Screen eyebrow="Saturday check-in" title="Scan QR" nav="scan">
      <Card>
        <Scanner />
      </Card>
    </Screen>
  );
}
