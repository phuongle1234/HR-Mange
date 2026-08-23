import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_REGEX } from '../constants/app.constants';

/**
 * Password policy per WORK-000 decision #6: minimum 8 characters, at least
 * one letter and one number.
 */
export function satisfiesPasswordPolicy(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }
  return (
    PASSWORD_POLICY_REGEX.hasLetter.test(password) && PASSWORD_POLICY_REGEX.hasNumber.test(password)
  );
}
