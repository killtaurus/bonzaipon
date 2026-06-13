// The user's local calendar day as an ISO "YYYY-MM-DD" string.
// Used so day-rollover follows the device clock, not the UTC server.
export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
