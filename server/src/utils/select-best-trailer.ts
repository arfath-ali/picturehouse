export function selectBestTrailer(availableTrailers: any[]) {
  return (
    availableTrailers.find(
      (video: { name: string }) =>
        video.name.toLowerCase() === 'official trailer',
    ) ??
    availableTrailers.find(
      (video: { name: string }) =>
        video.name.toLowerCase() === 'official trailer 1',
    ) ??
    availableTrailers.find(
      (video: { name: string }) => video.name.toLowerCase() === 'trailer',
    ) ??
    availableTrailers.find(
      (video: { name: string }) => video.name.toLowerCase() === 'trailer 1',
    ) ??
    availableTrailers.find((video: { name: string }) =>
      video.name.toLowerCase().includes('official trailer'),
    ) ??
    availableTrailers.find((video: { name: string }) =>
      video.name.toLowerCase().includes('trailer'),
    ) ??
    availableTrailers[0]
  );
}
