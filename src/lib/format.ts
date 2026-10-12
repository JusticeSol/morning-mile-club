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

export function memberName(profile: { full_name: string; display_name: string | null }) {
  return profile.display_name || profile.full_name.split(" ")[0];
}
