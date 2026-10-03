export const MIN_PASSWORD_LENGTH = 6;

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
