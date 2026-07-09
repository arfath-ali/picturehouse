export const VALID_MEDIA_TYPES = ['movie', 'tv'] as const;

export type mediaTypes = (typeof VALID_MEDIA_TYPES)[number];
