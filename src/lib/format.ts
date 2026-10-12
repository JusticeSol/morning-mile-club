// The club runs in Lagos; show every time in Lagos time regardless of the
// server's or phone's timezone.
const TZ = "Africa/Lagos";

export function formatRunDate(runDate: string) {
  // run_date is a plain date; pin it to midday UTC so no timezone shifts the day.
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${runDate}T12:00:00Z`));
}

export function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

// "06:30:00" -> "06:30"
export function formatClockTime(time: string) {
  return time.slice(0, 5);
}

// Today's date in Lagos as YYYY-MM-DD (comparable with runs.run_date).
export function lagosToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

// The coming Saturday in Lagos (today if it's Saturday), as YYYY-MM-DD.
export function nextSaturday() {
  const today = new Date(`${lagosToday()}T12:00:00Z`);
  today.setUTCDate(today.getUTCDate() + ((6 - today.getUTCDay() + 7) % 7));
  return today.toISOString().slice(0, 10);
}

// 4500 -> "1:15". Run times are whole minutes in the log form.
export function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

export function memberName(profile: { full_name: string; display_name: string | null }) {
  return profile.display_name || profile.full_name.split(" ")[0];
}
