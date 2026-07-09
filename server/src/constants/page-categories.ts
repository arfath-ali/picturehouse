export const VALID_PAGE_CATEGORIES = ['home', 'movies', 'tv-shows'] as const;

export type pageCategory = (typeof VALID_PAGE_CATEGORIES)[number];
