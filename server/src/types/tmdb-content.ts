export interface TMDBMediaDetails {
  schema: 'details';
  id: string;
  type: 'movie' | 'tv';
  title: string;
  overview: string | null;
  tagline: string | null;
  genres: string[] | null;

  imdbId: string | null;
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
    checked: boolean;
  };

  theme: {
    hue: number | null;
    saturation: string | null;
    lightness: string | null;
  };

  lastUpdated: number;
}

export interface TMDBMediaFeatured {
  schema: 'featured';
  id: string;
  type: 'movie' | 'tv';
  title: string;
  overview: string | null;
  releaseYear: string | null;
  duration: string | null;
  certification: Record<string, string | null> | null;
  images: {
    logo: string | null;
    poster: {
      small: string;
      medium: string;
    } | null;
    backdrop: { medium: string; large: string } | null;
  };
  theme: {
    hue: number | null;
    saturation: string | null;
    lightness: string | null;
  };
  lastUpdated: number;
}

export interface TMDBMediaShelf {
  schema: 'shelf';
  id: string;
  type: 'movie' | 'tv';
  title: string;
  images: {
    poster: {
      small: string;
      medium: string;
    } | null;
  };
  lastUpdated: number;
}

export interface TMDBMediaSearch {
  schema: 'search';
  id: string;
  type: 'movie' | 'tv';
  title: string;
  images: {
    poster: {
      small: string;
      medium: string;
    } | null;
  };
}
