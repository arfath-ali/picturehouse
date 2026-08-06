export interface ApiErrorResponseBody {
  code: string;
  message: string;
  targetInput: string;
}

export interface ApiErrorResponse extends Error {
  status: number;
  code: string;
  message: string;
  targetInput: string;
}

export type ErrorPageType =
  | "signin-page"
  | "forgot-password-page"
  | "reset-password-email-sent-page"
  | "reset-password-page"
  | "reset-password-page-expired"
  | "signup-page"
  | "verify-email-page"
  | "verification-session-invalid"
  | "email-already-verified"
  | "browse-page"
  | "search-page"
  | "details-page"
  | "watchlist-page";

export type ErrorConfig = {
  heading: string;
  description: string;
  actionText: string;
  iconName: string;
  href?: string;
};
