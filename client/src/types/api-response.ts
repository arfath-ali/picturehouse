import type { MediaPreview } from "./media-preview.js";
import type { TMDBContent } from "./tmdb-content.js";
import type { WatchlistSortPreferenceType } from "./watchlist-sort-preference.js";

export type ProfileResponse = {
  success: boolean;
  avatar_url: string;
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  is_google_user: boolean;
  has_password: boolean;
};

export type SignInResponse = {
  success: boolean;
  is_verified: boolean;
  user_id: string;
  avatar_url: string | null;
  email: string;
  is_google_user: boolean;
  has_password: boolean;
};

export type SignOutResponse = {
  success: boolean;
};

export type ForgotPasswordResponse = {
  success: boolean;
};

export type ResetPasswordValidationResponse = {
  success: boolean;
};

export type ResetPasswordResponse = {
  success: boolean;
};

export type SignUpResponse = {
  success: boolean;
};

export type GoogleAuthResponse = {
  success: boolean;
  googleConsentURL: string;
};

export type CheckUsernameResponse = {
  success: boolean;
};

export type VerifyEmailResponse = {
  success: boolean;
  user_id: string;
  avatar_url: string | null;
  is_google_user: boolean;
  has_password: boolean;
};

export type ResendVerificationEmailResponse = {
  success: boolean;
};

export type ProfileAvatarEditResponse = {
  success: boolean;
  avatar_url: string;
};

export type ProfileIdentityEditResponse = {
  success: boolean;
};

export type ProfilePasswordEditResponse = {
  success: boolean;
};

export type ProfileEmailEditResponse = {
  success: boolean;
};

export type DeleteAccountResponse = {
  success: boolean;
};

export type GeoLocationResponse = {
  success: boolean;
  countryCode: string;
};

export type FeaturedCollectionResponse = {
  success: boolean;
  featuredCollection: TMDBContent[];
};

export type MediaShelfCollectionResponse = {
  success: boolean;
  mediaShelfCollection: TMDBContent[];
};

export type MediaDetailsReponse = {
  success: true;
  mediaDetails: TMDBContent;
};

export type SearchResultsResponse = {
  success: boolean;
  searchResults: TMDBContent[];
  totalPages: number;
  totalResults: number;
};

export type GetWatchlistResponse = {
  success: boolean;
  watchlistSortPreference: WatchlistSortPreferenceType;
  watchlist: MediaPreview[];
};

export type AddToWatchlistResponse = {
  success: boolean;
  isWatchlisted: boolean;
};

export type RemoveFromWatchlistResponse = {
  success: boolean;
  isWatchlisted: boolean;
};

export type updateWatchlistSortPreferenceResponse = {
  success: boolean;
};
