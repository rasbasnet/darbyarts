import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL ?? '').replace(/\/$/, '');
const POSTER_TEST_PRICE_ENABLED = Boolean(process.env.REACT_APP_POSTER_TEST_PRICE_CENTS);
const POSTER_PASSWORD_FLAG =
  (process.env.REACT_APP_POSTERS_REQUIRE_PASSWORD ?? process.env.REACT_APP_POSTERS_PASSWORD_REQUIRED ?? '').toLowerCase() ===
  'true';
const REQUIRES_ACCESS = POSTER_TEST_PRICE_ENABLED || POSTER_PASSWORD_FLAG;

type PosterAccessContextValue = {
  requiresAccess: boolean;
  hasAccess: boolean;
  isVerifying: boolean;
  error: string | null;
  verifyPassword: (password: string) => Promise<boolean>;
  resetError: () => void;
};

const PosterAccessContext = createContext<PosterAccessContextValue | undefined>(undefined);

export const PosterAccessProvider = ({ children }: { children: ReactNode }) => {
  const [hasAccess, setHasAccess] = useState(!REQUIRES_ACCESS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/posters/access` : '/api/posters/access';

  const verifyPassword = useCallback(
    async (password: string) => {
      if (!REQUIRES_ACCESS) {
        setHasAccess(true);
        return true;
      }

      const trimmed = password.trim();
      if (!trimmed) {
        setError('Enter the test password to continue.');
        return false;
      }

      setIsVerifying(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: trimmed })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.granted) {
          setError(data?.error ?? 'Access denied.');
          return false;
        }

        setHasAccess(true);
        return true;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to verify access.');
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [endpoint]
  );

  const resetError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      requiresAccess: REQUIRES_ACCESS,
      hasAccess,
      isVerifying,
      error,
      verifyPassword,
      resetError
    }),
    [error, hasAccess, isVerifying, verifyPassword, resetError]
  );

  return <PosterAccessContext.Provider value={value}>{children}</PosterAccessContext.Provider>;
};

export const usePosterAccess = () => {
  const context = useContext(PosterAccessContext);
  if (!context) {
    throw new Error('usePosterAccess must be used within a PosterAccessProvider');
  }
  return context;
};
