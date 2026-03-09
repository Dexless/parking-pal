import React, { createContext, useContext, useMemo, useState } from 'react';

type AuthContextValue = {
  loggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
  userId: string | null;
  setUserId: (value: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      loggedIn,
      setLoggedIn,
      userId,
      setUserId,
    }),
    [loggedIn, userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
