"use client";

import { useOptimistic, useTransition } from "react";
import { Card } from "@/components/ui";
import { setLeaderboardHidden } from "./actions";

// "Hide me from the leaderboard": flips straight away, saves in the background.
export function LeaderboardToggle({ hidden }: { hidden: boolean }) {
  const [shownHidden, setShownHidden] = useOptimistic(hidden);
  const [, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setShownHidden(!shownHidden);
      await setLeaderboardHidden(!shownHidden);
    });

  return (
    <Card>
      <div id="leaderboard" className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold uppercase">Hide me from the leaderboard</h2>
          <p className="mt-1 text-sm text-navy/60">
            {shownHidden
              ? "You're hidden. Your runs still count for your streaks, badges and the club goal."
              : "Others can see your km, Saturdays and streak on the leaderboard."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={shownHidden}
          aria-label="Hide me from the leaderboard"
          onClick={toggle}
          className={`relative mt-1 h-8 w-14 shrink-0 rounded-full transition ${shownHidden ? "bg-sunrise" : "bg-navy/20"}`}
        >
          <span
            className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform ${
              shownHidden ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>
    </Card>
  );
}
