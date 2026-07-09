export function parseStreamingPlatformsByRegion(watchProvidersResults: any) {
  if (!watchProvidersResults) return null;

  const streamingPlatformsByRegion: Record<
    string,
    Array<{ name: string; logo: string | null }>
  > = {};

  for (const [countryCode, regionalAvailability] of Object.entries(
    watchProvidersResults,
  )) {
    const subscriptionPlatforms = (regionalAvailability as any).flatrate;

    if (!subscriptionPlatforms) continue;

    const renderedPlatforms = new Set<string>();

    streamingPlatformsByRegion[countryCode] = subscriptionPlatforms
      .filter(
        (streamingPlatform: any) =>
          !streamingPlatform.provider_name.includes('with Ads'),
      )
      .filter((streamingPlatform: any) => {
        if (
          [...renderedPlatforms].some((seen) =>
            streamingPlatform.provider_name.startsWith(seen),
          )
        ) {
          return false;
        }
        renderedPlatforms.add(streamingPlatform.provider_name);
        return true;
      })
      .map((streamingPlatform: any) => ({
        name: streamingPlatform.provider_name,
        logo: streamingPlatform.logo_path
          ? `${process.env.TMDB_IMAGE_BASE_URL}/w92${streamingPlatform.logo_path}`
          : null,
      }));
  }

  return streamingPlatformsByRegion;
}
