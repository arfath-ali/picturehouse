import type { FormValidationResult } from '../types/form-validation-result.js';

export function validateUsername(username: string) {
  const validation: FormValidationResult = { message: '', isValid: false };

  if (username.length === 0) {
    validation.message = 'Username is required.';
  } else if (username.length < 3 || username.length > 30) {
    validation.message = 'Username must be between 3 and 30 characters.';
  } else if (!/^[a-z0-9_][a-z0-9_.-]*[a-z0-9_]$/.test(username)) {
    validation.message =
      'Use letters, numbers, (_), (.), or (-). Cannot start/end with (.) or (-).';
  } else {
    validation.isValid = true;
  }

  return validation;
}

export function validateEmail(email: string) {
  const validation: FormValidationResult = { message: '', isValid: false };

  if (email.length === 0) {
    validation.message = 'Email is required.';
  } else if (email.length > 256 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    validation.message = 'Please enter a valid email address.';
  } else {
    validation.isValid = true;
  }

  return validation;
}

export function validatePassword(password: string) {
  const validation: FormValidationResult = { message: '', isValid: false };

  if (password.length === 0) {
    validation.message = 'Password is required.';
  } else if (password.length < 8 || password.length > 128) {
    validation.message = 'Password must be between 8 and 128 characters.';
  } else if (password.length < 8) {
    validation.message = 'Password must contain at least 8 characters.';
  } else if (!/[A-Z]/.test(password)) {
    validation.message = 'Password must contain at least one uppercase letter.';
  } else if (!/[a-z]/.test(password)) {
    validation.message = 'Password must contain at least one lowercase letter.';
  } else if (!/\d/.test(password)) {
    validation.message = 'Password must contain at least one number.';
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    validation.message =
      'Password must contain at least one special character.';
  } else {
    validation.isValid = true;
  }

  return validation;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
) {
  const validation: FormValidationResult = { message: '', isValid: false };

  if (confirmPassword.length === 0 || confirmPassword !== password) {
    validation.message = 'Passwords do not match.';
  } else {
    validation.isValid = true;
  }

  return validation;
}
