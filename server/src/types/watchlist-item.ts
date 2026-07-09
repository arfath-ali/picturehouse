export interface WatchlistItem {
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
