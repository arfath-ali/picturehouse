import type { shelfCategory } from "../types/shelf-category.js";

export const shelves: Record<string, shelfCategory[]> = {
  home: [
    { title: "Top Rated Films", identifier: "top-rated-films" },
    { title: "Top Rated Shows", identifier: "top-rated-shows" },
    { title: "Award-Winning Cinema", identifier: "award-winning-cinema" },
    { title: "Timeless Classics", identifier: "timeless-classics" },
    { title: "Boxoffice Legends", identifier: "boxoffice-legends" },
  ],

  movies: [
    { title: "Trending Now", identifier: "trending-movies" },
    { title: "Drama", identifier: "drama" },
    { title: "Action & Adventure", identifier: "action-adventure" },
    { title: "Crime & Thriller", identifier: "crime-thriller" },
    { title: "Comedy", identifier: "comedy" },
    { title: "Bollywood Cinema", identifier: "bollywood-hits" },
    { title: "Horror", identifier: "horror" },
    { title: "Romance", identifier: "romance" },
    { title: "Telugu Cinema", identifier: "telugu-originals" },
    { title: "Science Fiction", identifier: "science-fiction" },
    { title: "Tamil & Malayalam Cinema", identifier: "tamil-malayalam-cinema" },
    { title: "Documentary", identifier: "documentary" },
    { title: "Korean Cinema", identifier: "korean-cinema" },
  ],

  "tv-shows": [
    { title: "Trending Now", identifier: "trending-tv-shows" },
    { title: "Popular", identifier: "popular" },
    { title: "Critically Acclaimed", identifier: "critically-acclaimed" },
    { title: "Drama", identifier: "drama" },
    { title: "Crime & Thriller", identifier: "crime-thriller" },
    { title: "Action & Adventure", identifier: "action-adventure" },
    { title: "Comedy & Sitcom", identifier: "comedy-sitcom" },
    { title: "Sci-Fi & Fantasy", identifier: "sci-fi-fantasy" },
    { title: "Horror", identifier: "horror" },
    { title: "Mystery & Suspense", identifier: "mystery-suspense" },
    { title: "Anime", identifier: "anime" },
    { title: "Indian Originals", identifier: "indian-originals" },
    { title: "Documentary", identifier: "documentary" },
  ],
};
