export function getMediaCertification(tmdbData: any, mediaType: string) {
  const certificationResults =
    mediaType === 'tv'
      ? tmdbData.content_ratings?.results
      : tmdbData.release_dates?.results;

  if (!certificationResults) return null;

  const certificationByRegion: Record<string, string | null> = {};

  for (const [_, ratings] of Object.entries(certificationResults)) {
    const region = (ratings as any).iso_3166_1;

    if (!region) continue;

    certificationByRegion[region] =
      mediaType === 'tv'
        ? (ratings as any).rating
        : (ratings as any).release_dates?.[0].certification || null;
  }

  return certificationByRegion;
}
