export interface MediaPreview {
  id: string;
  type: "movie" | "tv";
  title: string;
  images: {
    poster: {
      small: string;
      medium: string;
    } | null;
  };
  created_at?: string;
}
