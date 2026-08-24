let pendingVerificationEmail: string = "<your-email@example.com>";
let pendingPasswordResetEmail: string = "<your-email@example.com>";
let isPasswordResetSuccessful: boolean = false;

export const authStore = {
  setPendingVerificationEmail: (email: string) => {
    pendingVerificationEmail = email;
  },
  getPendingVerificationEmail: () => pendingVerificationEmail,
  clearPendingVerificationEmail: () => {
    pendingVerificationEmail = "<your-email@example.com>";
  },

  setPendingPasswordResetEmail: (email: string) => {
    pendingPasswordResetEmail = email;
  },
  getPendingPasswordResetEmail: () => pendingPasswordResetEmail,
  clearPendingPasswordResetEmail: () => {
    pendingPasswordResetEmail = "<your-email@example.com>";
  },

  setIsPasswordResetSuccessful: (status: boolean) => {
    isPasswordResetSuccessful = status;
  },
  getIsPasswordResetSuccessful: () => isPasswordResetSuccessful,
};
