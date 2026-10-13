import { Card } from "@/components/ui";
import { saturdayRoute } from "@/lib/route";

export function RouteCard({ startTime }: { startTime?: string }) {
  const stops = saturdayRoute(startTime);
  return (
    <Card>
      <p className="mb-3 text-sm font-medium uppercase tracking-widest text-sunrise-ink">The Saturday route</p>
      <ol className="relative">
        {stops.map((stop, i) => (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector line between stops */}
            {i < stops.length - 1 && (
              <span className="absolute top-9 bottom-0 left-[17px] w-0.5 bg-navy/10" aria-hidden />
            )}
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper text-lg"
              aria-hidden
            >
              {stop.icon}
            </span>
            <span className="min-w-0 flex-1 pt-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{stop.place}</span>
                {stop.time && <span className="shrink-0 font-display text-lg font-bold">{stop.time}</span>}
              </span>
              <span className="block text-sm text-navy/60">{stop.note}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
