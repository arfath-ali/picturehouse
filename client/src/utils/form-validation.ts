export function validateUsername(username: string) {
  let errorMessage = "";

  if (username.length === 0) return;
  else if (username.length < 3) {
    errorMessage = "Username must be at least 3 characters.";
  } else if (!/^[a-z0-9_][a-z0-9_.-]*[a-z0-9_]$/.test(username)) {
    errorMessage =
      "Use letters, numbers, (_), (.), or (-). Cannot start/end with (.) or (-).";
  } else {
  }

  return errorMessage;
}

export function validateEmail(email: string) {
  let errorMessage = "";

  if (email.length === 0) return;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMessage = "Please enter a valid email address.";
  } else {
  }

  return errorMessage;
}

export function validatePassword(password: string) {
  let errorMessage = "";

  if (password.length === 0) return;
  else if (password.length < 8) {
    errorMessage = "Password must be at least 8 characters.";
  } else if (password.length < 8) {
    errorMessage = "Password must contain at least 8 characters.";
  } else if (!/[A-Z]/.test(password)) {
    errorMessage = "Password must contain at least one uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    errorMessage = "Password must contain at least one lowercase letter.";
  } else if (!/\d/.test(password)) {
    errorMessage = "Password must contain at least one number.";
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errorMessage = "Password must contain at least one special character.";
  }

  return errorMessage;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
) {
  let errorMessage = "";

  if (confirmPassword.length === 0) return;
  else if (confirmPassword !== password) {
    errorMessage = "Passwords do not match.";
  }

  return errorMessage;
}
