import type { AppState } from '../types/app-state.types.js';

const TITLES: Record<AppState, string> = {
  '': 'Picturehouse',
  home: 'Picturehouse | Discover Cinema',
  movies: 'Movies | Picturehouse',
  'tv-shows': 'TV Shows | Picturehouse',
  details: 'Details | Picturehouse',
  search: 'Search | Picturehouse',
  watchlist: 'My Watchlist | Picturehouse',
  profile: 'My Profile | Picturehouse',
  error: 'Page not found | Picturehouse',
};

export function updatePageTitle(title: AppState) {
  document.title = TITLES[title];
}
