import type { ReactNode } from "react";
import Link from "next/link";
import type { RunStatus } from "@/lib/types";

export type Tab = "home" | "scan" | "board" | "profile";

// Shared mobile-first page frame: navy header band, content card below.
// `nav` adds the bottom nav (members' pages); pass a tab to highlight it.
export function Screen({
  eyebrow,
  title,
  nav,
  children,
}: {
  eyebrow?: string;
  title: string;
  nav?: Tab | true;
  children: ReactNode;
}) {
  return (
    <main className={`flex flex-1 flex-col ${nav ? "pb-20" : ""}`}>
      <header className="bg-navy px-5 pt-10 pb-8 text-white">
        <div className="mx-auto max-w-md">
          {eyebrow && (
            <p className="text-sm font-medium uppercase tracking-widest text-sunrise">{eyebrow}</p>
          )}
          <h1 className="font-hand text-4xl uppercase leading-tight">{title}</h1>
        </div>
      </header>
      <div className="mx-auto w-full max-w-md flex-1 px-5 py-6">{children}</div>
      {nav && <BottomNav active={nav === true ? undefined : nav} />}
    </main>
  );
}

const TABS: { tab: Tab; href: string; label: string; icon: ReactNode }[] = [
  {
    tab: "home",
    href: "/",
    label: "Home",
    icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    tab: "scan",
    href: "/scan",
    label: "Scan",
    icon: <path d="M3 3h7v7H3zm2 2v3h3V5zm9-2h7v7h-7zm2 2v3h3V5zM3 14h7v7H3zm2 2v3h3v-3zm9-2h3v3h-3zm3 3h4v4h-3v-1h-1zm-3 2h2v2h-2zm5-5h2v2h-2z" />,
  },
  {
    tab: "board",
    href: "/leaderboard",
    label: "Board",
    icon: <path d="M4 21V11h4v10zm6 0V4h4v17zm6 0v-7h4v7z" />,
  },
  {
    tab: "profile",
    href: "/profile",
    label: "Profile",
    icon: <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9m-8 9c0-4 3.6-7 8-7s8 3 8 7z" />,
  },
];

function BottomNav({ active }: { active?: Tab }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-navy pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ tab, href, label, icon }) => {
          const current = tab === active;
          return (
            <li key={tab}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold uppercase tracking-wider ${
                  current ? "text-sunrise" : "text-white/60"
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden>
                  {icon}
                </svg>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Initials avatar until photo upload exists.
export function Avatar({ name, size = "md", me = false }: { name: string; size?: "md" | "lg"; me?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const dims = size === "lg" ? "size-20 text-3xl" : "size-10 text-base";
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold ${dims} ${
        me ? "bg-sunrise text-white" : "bg-navy/10 text-navy"
      }`}
    >
      {initials}
    </span>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-2xl bg-white p-5 shadow-sm">{children}</section>;
}

export const buttonClass =
  "inline-flex w-full items-center justify-center rounded-xl bg-sunrise px-5 py-4 font-display text-xl font-bold uppercase tracking-wide text-white transition active:scale-[0.98] disabled:opacity-60";

export const inputClass =
  "w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-lg outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";

export function Message({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  const styles = tone === "error" ? "bg-red-50 text-red-800" : "bg-teal/10 text-teal";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}

export function StatusPill({ status }: { status: RunStatus }) {
  const styles = {
    scheduled: "bg-sunrise/15 text-sunrise-ink",
    completed: "bg-teal/15 text-teal",
    cancelled: "bg-navy/10 text-navy/60",
  }[status];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${styles}`}>{status}</span>;
}
