import type { ErrorConfig, ErrorPageType } from "../types/errors.js";
import { createIcon } from "../utils/icon.js";

const ERROR_CONFIGS: Record<ErrorPageType, ErrorConfig> = {
  "signin-page": {
    heading: "Something went wrong",
    description:
      "We couldn't log you in right now due to a temporary issue. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "forgot-password-page": {
    heading: "Something went wrong",
    description:
      "We couldn't process your password reset request right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "reset-password-email-sent-page": {
    heading: "Something went wrong",
    description:
      "We couldn't resend your password reset email right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "reset-password-page": {
    heading: "Something went wrong",
    description:
      "We couldn't reset your password right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "reset-password-page-expired": {
    heading: "Reset Link Invalid",
    description:
      "This password reset link is invalid or has expired. Please request a new link to reset your password.",
    actionText: "Request New Link",
    iconName: "icon-info",
    href: "/forgot-password",
  },

  "signup-page": {
    heading: "Something went wrong",
    description:
      "We couldn't create your account right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "verify-email-page": {
    heading: "Something went wrong",
    description:
      "We couldn't verify your email right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "verification-session-invalid": {
    heading: "Session Expired",
    description:
      "We couldn't verify your email address. Your session may be invalid or expired.",
    actionText: "Go to Sign In",
    iconName: "icon-info",
    href: "/sign-in",
  },

  "email-already-verified": {
    heading: "Already Verified",
    description:
      "Your email has already been verified. You can now sign in to your account.",
    actionText: "Go to Sign In",
    iconName: "icon-success",
    href: "/sign-in",
  },

  "browse-page": {
    heading: "Something went wrong",
    description:
      "We couldn't load the content right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "search-page": {
    heading: "Something went wrong",
    description:
      "We couldn't load the search page right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "details-page": {
    heading: "Something went wrong",
    description:
      "We couldn't load this title right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },

  "watchlist-page": {
    heading: "Something went wrong",
    description:
      "We couldn't load your watchlist right now. Please try again in a few moments.",
    actionText: "Try Again",
    iconName: "icon-error",
  },
};

export function ErrorState(page: ErrorPageType) {
  const config = ERROR_CONFIGS[page];

  const isAuthPage =
    page === "signin-page" ||
    page === "forgot-password-page" ||
    page === "reset-password-email-sent-page" ||
    page === "reset-password-page" ||
    page === "reset-password-page-expired" ||
    page === "signup-page" ||
    page === "verify-email-page" ||
    page === "verification-session-invalid" ||
    page === "email-already-verified";

  const section = document.createElement("section");
  section.classList.add("site-error");

  if (isAuthPage) {
    section.classList.add("auth-card");
    const picturehouseLogo = document.createElement("img");
    picturehouseLogo.classList.add(
      "h-auto",
      "w-[clamp(11.25rem,7.679rem+9.524vw,16.25rem)]",
    );
    picturehouseLogo.src = "/src/assets/images/brand.png";

    section.append(picturehouseLogo);
  }

  let iconElement: SVGElement;

  if (page === "email-already-verified") {
    const iconElementWrapper = document.createElement("div");
    iconElementWrapper.classList.add("auth-header__status-icon");
    iconElement = createIcon(config.iconName, [
      "site-error__icon",
      "site-error__icon--success",
    ]);
    iconElementWrapper.append(iconElement);
    section.append(iconElementWrapper);
  } else {
    iconElement = createIcon(config.iconName, ["site-error__icon"]);
    section.append(iconElement);
  }

  const heading = document.createElement("h1");

  heading.textContent = config.heading;

  const description = document.createElement("p");

  description.textContent = config.description;

  const actionBtn = document.createElement("button");
  actionBtn.classList.add("btn", "btn--primary", "site-error__retry-btn");
  actionBtn.textContent = config.actionText;

  actionBtn.addEventListener("click", () => {
    if (config.href) {
      window.location.href = config.href;
    } else {
      window.location.reload();
    }
  });

  section.append(heading, description, actionBtn);

  return section;
}
