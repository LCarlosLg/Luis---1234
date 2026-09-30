// Tipos de la parte de usuarios y sesión.

// Así se guarda un usuario en LocalStorage. Ojo: guardamos el hash de la contraseña, nunca la contraseña.
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// Lo que se guarda de la sesión activa. Sin hash, a propósito.
export interface Session {
  userId: string;
  name: string;
  email: string;
}

// Esto es lo que usamos para registrar un usuario, 
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}