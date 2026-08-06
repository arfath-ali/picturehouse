export interface SignUpBody {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInBody {
  identifier: string;
  password: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface VerifyEmailBody {
  email: string;
  otp: string;
}

export interface ResendVerificationEmailBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetTokenValidationBody {
  token: string;
  email: string;
}
