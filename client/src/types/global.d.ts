export {};

declare global {
  interface Window {
    __AUTH_STATE__: {
      isUserAuthenticated: boolean;
      userId: string;
    };
  }
}
