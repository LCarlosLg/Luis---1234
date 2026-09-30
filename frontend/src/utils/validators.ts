export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function validateRegister(v: RegisterForm): FormErrors<RegisterForm> {
  const errors: FormErrors<RegisterForm> = {};

  const name = v.name.trim();
  if (!name) errors.name = "Ingresa tu nombre completo.";
  else if (name.split(/\s+/).length < 2) errors.name = "Ingresa nombre y apellido.";
  else if (name.length > 80) errors.name = "El nombre es demasiado largo.";

  if (!v.email.trim()) errors.email = "Ingresa tu correo electrónico.";
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = "El correo no tiene un formato válido.";

  if (!v.password) errors.password = "Ingresa una contraseña.";
  else if (v.password.length < 8) errors.password = "Debe tener al menos 8 caracteres.";
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password))
    errors.password = "Debe incluir al menos una letra y un número.";

  if (!v.confirmPassword) errors.confirmPassword = "Confirma tu contraseña.";
  else if (v.confirmPassword !== v.password)
    errors.confirmPassword = "Las contraseñas no coinciden.";

  return errors;
}

export function validateLogin(email: string, password: string) {
  const errors: FormErrors<{ email: string; password: string }> = {};
  if (!email.trim()) errors.email = "Ingresa tu correo electrónico.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "El correo no tiene un formato válido.";
  if (!password) errors.password = "Ingresa tu contraseña.";
  return errors;
}
