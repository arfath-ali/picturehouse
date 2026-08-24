export {};

declare global {
  interface Window {
    __AUTH_STATE__: {
      isUserAuthenticated: boolean;
      isGoogleUser: boolean;
      hasPassword: boolean;
      userId: string;
      avatarURL: string | null;
    };
  }
}
