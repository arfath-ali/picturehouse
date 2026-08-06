export interface WatchlistBody {
  id: string;
  type: string;
  title: string;
  images: {
    poster: {
      small: string;
      medium: string;
    } | null;
  };
}

export interface watchlistSortPreferenceBody {
  watchlistSortPreference: string;
}
