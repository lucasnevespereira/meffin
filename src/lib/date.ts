// get day of month from ISO date
export function getDayOfMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.getDate();
}

//  get month name (localized)
export function getMonthName(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("fr-FR", { month: "long" });
}
