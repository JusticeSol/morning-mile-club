import { Card } from "@/components/ui";
import { formatRunDate } from "@/lib/format";
import type { RunPhoto } from "@/lib/run-photo";

// Home page: the latest group photo from the turnaround. Tap for full size.
export function PhotoOfTheWeek({ photo }: { photo: RunPhoto }) {
  return (
    <Card>
      <p className="text-sm font-medium uppercase tracking-widest text-sunrise-ink">Photo of the week</p>
      <p className="mb-3 text-navy/70">
        {photo.runTitle ?? "Saturday run"} · {formatRunDate(photo.runDate)}
      </p>
      <a href={photo.url} target="_blank" rel="noopener noreferrer">
        {/* Already a resized JPEG (≤1600px), so a plain <img> is fine. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.caption ?? "Group photo"} loading="lazy" className="-mx-1 w-[calc(100%+0.5rem)] rounded-xl" />
      </a>
      {photo.caption && <p className="mt-3 font-medium">{photo.caption}</p>}
    </Card>
  );
}
