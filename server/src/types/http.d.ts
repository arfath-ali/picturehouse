import * as http from 'node:http';
import type { mediaShelfCategory } from '../constants/media-shelf-categories.ts';
import type { pageCategory } from '../constants/page-categories.ts';
import type { mediaTypes } from '../constants/media-types.ts';

declare module 'node:http' {
  interface IncomingMessage {
    body: unknown;
    params?: {
      page?: pageCategory;
      mediaShelf?: mediaShelfCategory;
      mediaType?: mediaTypes;
      tmdbId?: string;
      query?: string;
      searchPage?: string;
      mediaId?: string;
    };
  }
}
