import type { RegisterInput, Session, StoredUser } from "../types";
import { hashPassword, verifyPassword } from "../utils/password";
import { readJSON, removeKey, writeJSON } from "../utils/storage";
import { normalizeEmail } from "../utils/validators";

const USERS_KEY = "caracoles:users";
const SESSION_KEY = "caracoles:session";

export type AuthErrorCode = "EMAIL_TAKEN" | "INVALID_CREDENTIALS";

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

const loadUsers = () => readJSON<Record<string, StoredUser>>(USERS_KEY, {});

const toSession = (u: StoredUser): Session => ({ userId: u.id, name: u.name, email: u.email });

export async function register(input: RegisterInput): Promise<Session> {
  const email = normalizeEmail(input.email);
  const users = loadUsers();
  if (users[email]) {
    throw new AuthError("EMAIL_TAKEN", "Ya existe una cuenta con este correo.");
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: input.name.trim().replace(/\s+/g, " "),
    email,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  writeJSON(USERS_KEY, { ...users, [email]: user });

  const session = toSession(user);
  writeJSON(SESSION_KEY, session);
  return session;
}

export async function login(emailInput: string, password: string): Promise<Session> {
  const user = loadUsers()[normalizeEmail(emailInput)];
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    throw new AuthError("INVALID_CREDENTIALS", "Correo o contraseña incorrectos.");
  }
  const session = toSession(user);
  writeJSON(SESSION_KEY, session);
  return session;
}

export function logout(): void {
  removeKey(SESSION_KEY);
}

/** Devuelve la sesión guardada solo si el usuario todavía existe. */
export function getStoredSession(): Session | null {
  const session = readJSON<Session | null>(SESSION_KEY, null);
  if (!session) return null;
  const user = loadUsers()[normalizeEmail(session.email)];
  return user && user.id === session.userId ? session : null;
}
