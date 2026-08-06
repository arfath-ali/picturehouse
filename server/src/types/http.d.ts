import * as http from 'node:http';
import { IncomingMessage } from 'node:http';
import type { mediaShelfCategory } from '../constants/media-shelf-categories.ts';
import type { pageCategory } from '../constants/page-categories.ts';
import type { mediaTypes } from '../constants/media-types.ts';

declare module 'node:http' {
  interface IncomingMessage {
    params?: {
      username?: string;
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

interface IncomingRequest<TBody> extends IncomingMessage {
  body: TBody;
  userId: string;
  sessionId: string;
}
