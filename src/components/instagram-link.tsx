import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/social";

// Small "@themorningmileclub" link with the Instagram glyph.
export function InstagramLink({ label = `@${INSTAGRAM_HANDLE}`, className = "" }: { label?: string; className?: string }) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 font-medium text-sunrise-ink ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
      {label}
    </a>
  );
}
