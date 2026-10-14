import { router } from 'expo-router';
import { createContext, type ReactNode, use, useEffect, useState } from 'react';

import { type AuthUser, fetchIsAdmin, getCurrentUser, onAuthChange, signOut } from '@/lib/auth';
import { onNotificationTap, registerForPush } from '@/lib/push';

type AuthValue = {
  /** undefined while the saved session is being read. */
  user: AuthUser | null | undefined;
  /** True when the signed-in user is in public.admins (may approve shops). */
  isAdmin: boolean;
  setUser: (user: AuthUser | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [adminFor, setAdminFor] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser, () => setUser(null));
    return onAuthChange(setUser);
  }, []);

  // Look up the admin flag once per signed-in user, and register this device for push.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchIsAdmin().then((yes) => !cancelled && yes && setAdminFor(userId));
    registerForPush();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Tapping a "new request" notification opens the mechanic's inbox.
  useEffect(
    () =>
      onNotificationTap((data) => {
        if (data.type === 'request') router.push('/requests');
      }),
    []
  );

  const value: AuthValue = {
    user,
    isAdmin: userId !== null && adminFor === userId,
    setUser,
    signOut: async () => {
      await signOut();
      setUser(null);
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
