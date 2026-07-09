export function formatRuntime(minutes: number): string | null {
  if (!minutes) return null;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
