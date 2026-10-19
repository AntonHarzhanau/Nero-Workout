const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthFormat = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortMonthFormat = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  timeZone: "UTC",
});

export function formatWorkoutDate(date: string) {
  return dayFormat.format(new Date(`${date}T00:00:00Z`));
}
export function formatWorkoutMonth(month: string) {
  return monthFormat.format(new Date(`${month}-01T00:00:00Z`));
}
export function formatShortMonth(date: string) {
  return shortMonthFormat
    .format(new Date(`${date}T00:00:00Z`))
    .replace(".", "");
}
export function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function formatDuration(minutes: number | null) {
  return minutes === null ? "Non renseignée" : `${minutes} min`;
}
