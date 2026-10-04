export const PASSWORD_POLICY_TEXT = "La password deve contenere almeno 10 caratteri, una lettera maiuscola, una minuscola e un numero.";
export const RECOVERY_COOKIE = "armonia-password-recovery";

export type PasswordFields = { password: string; confirmPassword: string };
export type PasswordErrors = Partial<Record<keyof PasswordFields, string>>;

export function passwordPolicyError(password: string) {
  if (!password) return "Inserisci una password.";
  if (password.length < 10) return "Usa almeno 10 caratteri.";
  if (!/[a-z]/.test(password)) return "Aggiungi almeno una lettera minuscola.";
  if (!/[A-Z]/.test(password)) return "Aggiungi almeno una lettera maiuscola.";
  if (!/[0-9]/.test(password)) return "Aggiungi almeno un numero.";
  return undefined;
}

export function validateNewPassword(input: PasswordFields): PasswordErrors {
  const errors: PasswordErrors = {};
  const passwordError = passwordPolicyError(input.password);
  if (passwordError) errors.password = passwordError;
  if (!input.confirmPassword) errors.confirmPassword = "Conferma la password.";
  else if (input.password !== input.confirmPassword) errors.confirmPassword = "Le password non coincidono.";
  return errors;
}

export function recoveryRedirectUrl(origin: string) {
  return new URL("/auth/recovery", origin).toString();
}
