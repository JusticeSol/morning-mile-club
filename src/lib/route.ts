// The Saturday route, as the club runs it. Used on the home page and in the
// WhatsApp reminder. See "The Saturday route" in CLAUDE.md.

export type Stop = { icon: string; place: string; note: string; time?: string };

// "06:30:00" -> "6:00": the meetup is half an hour before the run starts.
function shift(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function saturdayRoute(startTime = "06:30:00"): Stop[] {
  return [
    { icon: "🏥", place: "Gbagada General Hospital", note: "Meet up", time: shift(startTime, -30) },
    {
      icon: "⛪",
      place: "Harvesters Church",
      note: "Stroll over by the expressway; the run starts here",
      time: shift(startTime, 0),
    },
    { icon: "🛑", place: "Anthony", note: "Stopover, 5-minute break" },
    { icon: "📸", place: "Maryland Mall", note: "Photos, high-fives and banter" },
    { icon: "🚶", place: "Anthony", note: "Stroll back" },
    {
      icon: "🏁",
      place: "Gbagada General Hospital",
      note: "Finish: final group picture, coffee and refreshments",
      time: `~${shift(startTime, 135)}`,
    },
  ];
}
