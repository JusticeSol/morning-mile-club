// Validates the km form (distance + optional h:mm), for members and admins.
export function parseKmForm(
  formData: FormData,
): { ok: false; error: string } | { ok: true; km: number; seconds: number | null } {
  const distance = Number(String(formData.get("distance_km") ?? "").replace(",", "."));
  const hours = Number(formData.get("hours") || 0);
  const minutes = Number(formData.get("minutes") || 0);

  if (!Number.isFinite(distance) || distance < 0.1 || distance > 60) {
    return { ok: false, error: "Distance must be between 0.1 and 60 km." };
  }
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
    return { ok: false, error: "Time should be whole hours and minutes (0–59)." };
  }
  const seconds = (hours * 60 + minutes) * 60;
  return { ok: true, km: Math.round(distance * 10) / 10, seconds: seconds > 0 ? seconds : null };
}
