export interface TMDBContent {
  id: string;
  type: "movie" | "tv";
  title: string;
  overview: string;
  tagline: string | null;
  genres: string[] | null;

  youtubeTrailerURL: string | null;

  releaseYear: string | null;
  duration: string | null;
  certification: Record<string, string | null> | null;

  crew: {
    creator: string[] | null;
    director: string[] | null;
    writer: string[] | null;
  };

  cast: Array<{
    name: string;
    profileImg: string | null;
    character: string | null;
  }> | null;

  streamingPlatforms: Record<
    string,
    Array<{ name: string; logo: string | null }>
  > | null;

  images: {
    logo: string | null;
    poster: { small: string; medium: string; large: string } | null;
    backdrop: { medium: string; large: string } | null;
  };

  ratings: {
    imdb: string | null;
    rottenTomatoes: string | null;
  };

  theme: {
    hue: number | null;
    saturation: string | null;
    lightness: string | null;
  };
}



