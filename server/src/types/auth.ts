import type { UserSessionScope } from './session-scope.js';

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
  source: string;
}

export interface VerifyEmailBody {
  email: string;
  otp: string;
  source: string;
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

export interface SignoutBody {
  signoutType: UserSessionScope;
}

export interface ProfileIdentityEditBody {
  full_name: string;
  username: string;
}

export interface ProfileEmailEditBody {
  email: string;
}

export interface ProfilePasswordEditBody {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface DeleteAccountBody {
  password: string;
}
