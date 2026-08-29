import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/** Password policy per WORK-000 decision #6: min 8 chars, at least one letter and one number. */
const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include a letter and a number.';

const newPasswordSchema = z
  .string()
  .min(8, PASSWORD_POLICY_MESSAGE)
  .regex(/[A-Za-z]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[0-9]/, PASSWORD_POLICY_MESSAGE);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: newPasswordSchema,
    confirmNewPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

/**
 * Redeeming an invitation. Reuses `newPasswordSchema` so the client policy
 * matches what the backend enforces (min 8, at least one letter and one
 * number) - a divergence here would show a form that passes locally and then
 * fails on submit.
 *
 * `token` comes from the URL, not from a user input, so it is validated only
 * as non-empty; the backend is the authority on whether it is real.
 */
export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1, 'Invitation token is required'),
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;
