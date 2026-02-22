import React, { createContext, useContext, useState, ReactNode } from "react";
import { AuthUser } from "@/types/conta";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const LOGIN_URL = "https://n8n.itadigital.com.br/webhook/ava-login";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("ita_user");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      // Check token expiry
      const loginTime = localStorage.getItem("ita_login_time");
      if (loginTime && parsed.expires) {
        const elapsed = (Date.now() - Number(loginTime)) / 1000;
        if (elapsed > parsed.expires) {
          localStorage.removeItem("ita_user");
          localStorage.removeItem("ita_login_time");
          return null;
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.status === "success" && data.response) {
        const u: AuthUser = {
          user_id: data.response.user_id,
          mail: data.response.mail,
          nome: data.response.nome,
          token: data.response.token,
          expires: data.response.expires,
        };
        setUser(u);
        localStorage.setItem("ita_user", JSON.stringify(u));
        localStorage.setItem("ita_login_time", String(Date.now()));
        return { ok: true };
      }

      return { ok: false, error: data.message || "Credenciais inválidas" };
    } catch (err) {
      return { ok: false, error: "Erro de conexão. Tente novamente." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ita_user");
    localStorage.removeItem("ita_login_time");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
