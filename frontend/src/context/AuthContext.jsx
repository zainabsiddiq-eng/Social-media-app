import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "kith_auth";

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);

  const value = useMemo(
    () => ({
      user: auth?.user || null,
      access: auth?.access || null,
      refresh: auth?.refresh || null,
      isAuthenticated: Boolean(auth?.access),
      login: (payload) => {
        const next = {
          access: payload.access,
          refresh: payload.refresh,
          user: payload.user,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setAuth(next);
      },
      updateUser: (user) => {
        setAuth((prev) => {
          if (!prev) return prev;
          const next = { ...prev, user: { ...prev.user, ...user } };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      },
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
