import { setAppState } from '../state/app.state.js';
import type { AppState } from '../types/app-state.types.js';

export function navigate() {
  let route = location.pathname.slice(1) as AppState;

  if (route === '') {
    history.replaceState({}, '', '/home');
    route = 'home';
  }

  const validAppStates: AppState[] = [
    'home',
    'movies',
    'tv-shows',
    'details',
    'search',
    'watchlist',
    'profile',
  ];

  if (validAppStates.includes(route)) {
    setAppState(route);
  } else setAppState('error');
}
