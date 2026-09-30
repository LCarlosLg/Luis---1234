import { useCallback, useMemo, useState, type ReactNode } from "react";
import * as authService from "../services/authService";
import type { RegisterInput, Session } from "../types";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Se lee de forma síncrona: al recargar no hay parpadeo hacia /login
  const [session, setSession] = useState<Session | null>(() => authService.getStoredSession());

  const register = useCallback(async (input: RegisterInput) => {
    setSession(await authService.register(input));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setSession(await authService.login(email, password));
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, register, login, logout }),
    [session, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
