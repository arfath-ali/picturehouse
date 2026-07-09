import type {
  TMDBMediaDetails,
  TMDBMediaFeatured,
  TMDBMediaSearch,
  TMDBMediaShelf,
} from '../types/tmdb-content.js';
import { formatDate } from '../utils/format-date.js';
import { formatRuntime } from '../utils/format-runtime.js';
import { getMediaCertification } from '../utils/media-certification.js';
import { extractPosterTheme } from '../utils/theme.js';
import { parseStreamingPlatformsByRegion } from '../utils/streaming-platforms.js';
import { selectBestTrailer } from '../utils/select-best-trailer.js';

export async function parseMediaFeatured(tmdbData: any, mediaType: string) {
  const jitter = Math.floor(Math.random() * 30 * 60 * 1000);

  const releaseDate = tmdbData.release_date || tmdbData.first_air_date;
  const releaseYear = formatDate(releaseDate);

  const duration = tmdbData.runtime
    ? formatRuntime(tmdbData.runtime)
    : tmdbData.number_of_seasons
      ? tmdbData.number_of_seasons === 1
        ? '1 season'
        : `${tmdbData.number_of_seasons} seasons`
      : null;

  const parsedCertificationByRegion = getMediaCertification(
    tmdbData,
    mediaType,
  );

  const certificationByRegion =
    parsedCertificationByRegion &&
    Object.keys(parsedCertificationByRegion).length > 0
      ? parsedCertificationByRegion
      : null;

  const logoData =
    tmdbData.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en') ??
    null;

  const themeSourceUrl = `${process.env.TMDB_IMAGE_BASE_URL}/w92${tmdbData.poster_path}`;

  let theme = {
    hue: 0 as number | null,
    saturation: '0' as string | null,
    lightness: '0' as string | null,
  };

  if (themeSourceUrl) {
    try {
      const extracted = await extractPosterTheme(themeSourceUrl);
      if (extracted) {
        theme = {
          hue: extracted.hue !== null ? Number(extracted.hue) : null,
          saturation:
            extracted.saturation !== null ? String(extracted.saturation) : null,
          lightness:
            extracted.lightness !== null ? String(extracted.lightness) : null,
        };
      }
    } catch (e) {}
  }

  const mediaPayload: TMDBMediaFeatured = {
    schema: 'featured',
    id: String(tmdbData.id),
    type: mediaType as 'movie' | 'tv',
    title: tmdbData.title || tmdbData.name,
    overview: tmdbData.overview ?? null,
    releaseYear: releaseYear ?? null,
    duration: duration ?? null,
    certification: certificationByRegion,
    images: {
      logo: logoData
        ? `${process.env.TMDB_IMAGE_BASE_URL}/w500${logoData.file_path}`
        : null,
      poster: tmdbData.poster_path
        ? {
            small: `${process.env.TMDB_IMAGE_BASE_URL}/w185${tmdbData.poster_path}`,
            medium: `${process.env.TMDB_IMAGE_BASE_URL}/w342${tmdbData.poster_path}`,
          }
        : null,
      backdrop: tmdbData.backdrop_path
        ? {
            medium: `${process.env.TMDB_IMAGE_BASE_URL}/w780${tmdbData.backdrop_path}`,
            large: `${process.env.TMDB_IMAGE_BASE_URL}/w1280${tmdbData.backdrop_path}`,
          }
        : null,
    },
    theme: {
      hue: theme.hue,
      saturation: theme.saturation,
      lightness: theme.lightness,
    },

    lastUpdated: Date.now() + jitter,
  };

  return mediaPayload;
}

export function parseMediaShelf(tmdbData: any, mediaType: string) {
  const jitter = Math.floor(Math.random() * 30 * 60 * 1000);

  const mediaPayload: TMDBMediaShelf = {
    schema: 'shelf',
    id: String(tmdbData.id),
    type: mediaType as 'movie' | 'tv',
    title: tmdbData.title || tmdbData.name,
    images: {
      poster: tmdbData.poster_path
        ? {
            small: `${process.env.TMDB_IMAGE_BASE_URL}/w185${tmdbData.poster_path}`,
            medium: `${process.env.TMDB_IMAGE_BASE_URL}/w342${tmdbData.poster_path}`,
          }
        : null,
    },
    lastUpdated: Date.now() + jitter,
  };

  return mediaPayload;
}

export function parseMediaSearch(tmdbData: any) {
  const tmdbArray = tmdbData?.results;
  const totalPages = tmdbData?.total_pages || 0;
  const totalResults = tmdbData?.total_results || 0;

  if (!Array.isArray(tmdbArray)) {
    return { mediaPayload: [], totalPages: 0, totalResults: 0 };
  }
  const mediaOnlyResults = tmdbArray.filter(
    (item) => item.media_type === 'movie' || item.media_type === 'tv',
  );

  if (mediaOnlyResults.length === 0) {
    return { mediaPayload: [], totalPages, totalResults };
  }
  const sortedByPopularity = mediaOnlyResults.sort((a, b) => {
    const scoreA = (a.popularity || 0) + (a.vote_count || 0) * 0.1;
    const scoreB = (b.popularity || 0) + (b.vote_count || 0) * 0.1;

    return scoreB - scoreA;
  });

  const mediaPayload: TMDBMediaSearch[] = sortedByPopularity.map((tmdbData) => {
    return {
      schema: 'search',
      id: String(tmdbData.id),
      type: tmdbData.media_type,
      title: tmdbData.title || tmdbData.name,
      images: {
        poster: tmdbData.poster_path
          ? {
              small: `${process.env.TMDB_IMAGE_BASE_URL}/w185${tmdbData.poster_path}`,
              medium: `${process.env.TMDB_IMAGE_BASE_URL}/w342${tmdbData.poster_path}`,
            }
          : null,
      },
    };
  });
  return {
    mediaPayload,
    totalPages,
    totalResults,
  };
}

export async function parseMediaDetails(tmdbData: any, mediaType: string) {
  const jitter = Math.floor(Math.random() * 30 * 60 * 1000);

  const parsedGenres = (tmdbData.genres || []).map(
    (genre: { name: string }) => genre.name,
  );

  const releaseDate = tmdbData.release_date || tmdbData.first_air_date;
  const releaseYear = formatDate(releaseDate);

  const duration = tmdbData.runtime
    ? formatRuntime(tmdbData.runtime)
    : tmdbData.number_of_seasons
      ? tmdbData.number_of_seasons === 1
        ? '1 season'
        : `${tmdbData.number_of_seasons} seasons`
      : null;

  const parsedCertificationByRegion = getMediaCertification(
    tmdbData,
    mediaType,
  );

  const certificationByRegion =
    parsedCertificationByRegion &&
    Object.keys(parsedCertificationByRegion).length > 0
      ? parsedCertificationByRegion
      : null;

  const availableTrailers = (tmdbData.videos?.results || []).filter(
    (video: { type: string; site: string; official: boolean }) =>
      video.type === 'Trailer' && video.site === 'YouTube' && video.official,
  );

  const trailerVideoObj = selectBestTrailer(availableTrailers);

  const mappedTrailerURL = trailerVideoObj
    ? `https://www.youtube.com/watch?v=${trailerVideoObj.key}`
    : null;

  const rawCastList = tmdbData.credits?.cast || [];
  const rawCrewList = tmdbData.credits?.crew || [];

  const creatorList =
    mediaType === 'tv'
      ? [
          ...new Set<string>(
            (tmdbData?.created_by || []).map((creator: any) => creator.name),
          ),
        ]
      : null;

  const directorList =
    mediaType === 'movie'
      ? [
          ...new Set<string>(
            rawCrewList
              .filter((crew: { job: string }) => crew.job === 'Director')
              .map((crew: { name: string }) => crew.name),
          ),
        ]
      : null;

  const writersList =
    mediaType === 'movie'
      ? [
          ...new Set<string>(
            rawCrewList
              ?.filter((crew: { job: string }) =>
                ['Writer', 'Screenplay'].includes(crew.job),
              )
              .map((crew: { name: string }) => crew.name),
          ),
        ]
      : null;

  const starring = rawCastList
    .filter((cast: any) => cast && cast.name)
    .map(
      (cast: {
        name: string;
        profile_path: string | null;
        character: string | null;
      }) => {
        return {
          name: cast.name,
          profileImg: cast.profile_path
            ? `${process.env.TMDB_IMAGE_BASE_URL}/w185/${cast.profile_path}`
            : null,
          character: cast.character ?? null,
        };
      },
    );

  const streamingAvailabilityResults = tmdbData['watch/providers']?.results;

  const parsedStreamingPlatforms = parseStreamingPlatformsByRegion(
    streamingAvailabilityResults,
  );

  const streamingPlatformsData =
    parsedStreamingPlatforms && Object.keys(parsedStreamingPlatforms).length > 0
      ? parsedStreamingPlatforms
      : null;

  const logoData =
    tmdbData.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en') ??
    null;

  const themeSourceUrl = `${process.env.TMDB_IMAGE_BASE_URL}/w92${tmdbData.poster_path}`;

  let theme = {
    hue: 0 as number | null,
    saturation: '0' as string | null,
    lightness: '0' as string | null,
  };

  if (themeSourceUrl) {
    try {
      const extracted = await extractPosterTheme(themeSourceUrl);
      if (extracted) {
        theme = {
          hue: extracted.hue !== null ? Number(extracted.hue) : null,
          saturation:
            extracted.saturation !== null ? String(extracted.saturation) : null,
          lightness:
            extracted.lightness !== null ? String(extracted.lightness) : null,
        };
      }
    } catch (e) {}
  }

  const mediaPayload: TMDBMediaDetails = {
    schema: 'details',
    id: String(tmdbData.id),
    type: mediaType as 'movie' | 'tv',
    title: tmdbData.title || tmdbData.name,
    overview: tmdbData.overview ?? null,
    tagline: tmdbData.tagline ?? null,
    genres: parsedGenres?.length ? parsedGenres : null,

    youtubeTrailerURL: mappedTrailerURL,
    imdbId: tmdbData?.external_ids?.imdb_id
      ? String(tmdbData?.external_ids?.imdb_id)
      : null,

    releaseYear: releaseYear ?? null,
    duration: duration ?? null,
    certification: certificationByRegion,

    crew: {
      creator: creatorList?.length ? creatorList : null,
      director: directorList?.length ? directorList : null,
      writer: writersList?.length ? writersList : null,
    },

    cast: starring.length > 0 ? starring : null,

    streamingPlatforms: streamingPlatformsData,

    images: {
      logo: logoData
        ? `${process.env.TMDB_IMAGE_BASE_URL}/w500${logoData.file_path}`
        : null,
      poster: tmdbData.poster_path
        ? {
            small: `${process.env.TMDB_IMAGE_BASE_URL}/w185${tmdbData.poster_path}`,
            medium: `${process.env.TMDB_IMAGE_BASE_URL}/w342${tmdbData.poster_path}`,
            large: `${process.env.TMDB_IMAGE_BASE_URL}/w500${tmdbData.poster_path}`,
          }
        : null,
      backdrop: tmdbData.backdrop_path
        ? {
            medium: `${process.env.TMDB_IMAGE_BASE_URL}/w780${tmdbData.backdrop_path}`,
            large: `${process.env.TMDB_IMAGE_BASE_URL}/w1280${tmdbData.backdrop_path}`,
          }
        : null,
    },

    ratings: {
      imdb: null,
      rottenTomatoes: null,
      checked: false,
    },

    theme: {
      hue: theme.hue,
      saturation: theme.saturation,
      lightness: theme.lightness,
    },

    lastUpdated: Date.now() + jitter,
  };

  return mediaPayload;
}
