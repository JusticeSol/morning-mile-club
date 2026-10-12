import type { ReactNode } from "react";

// Shared mobile-first page frame: navy header band, content card below.
export function Screen({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col">
      <header className="bg-navy px-5 pt-10 pb-8 text-white">
        <div className="mx-auto max-w-md">
          {eyebrow && (
            <p className="text-sm font-medium uppercase tracking-widest text-sunrise">{eyebrow}</p>
          )}
          <h1 className="font-display text-4xl font-bold uppercase leading-none">{title}</h1>
        </div>
      </header>
      <div className="mx-auto w-full max-w-md flex-1 px-5 py-6">{children}</div>
    </main>
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
