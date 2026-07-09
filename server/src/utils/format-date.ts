export function formatDate(date: string): string | null {
  if (!date) return null;

  const releaseYear = date.split('-')[0];

  if (!releaseYear) return null;

  return releaseYear;
}
