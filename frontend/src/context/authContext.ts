import { createContext } from "react";
import type { RegisterInput, Session } from "../types";

export interface AuthContextValue {
  session: Session | null;
  register: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
