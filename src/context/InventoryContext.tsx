import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type { InventorySnapshot, InventorySnapshotEntry } from '../services/inventory';
import { resolveInventoryKey } from '../utils/inventory';

type InventoryContextValue = {
  snapshot: InventorySnapshot | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getAvailability: (posterId: string, editionId?: string | null) => InventorySnapshotEntry | null;
};

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

type InventoryProviderProps = {
  children: ReactNode;
};

export const InventoryProvider = ({ children }: InventoryProviderProps) => {
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const { getInventorySnapshot } = await import('../services/inventory');
      const response = await getInventorySnapshot();
      setSnapshot(response.snapshot ?? null);
      setError(null);
    } catch (fetchError) {
      console.error('Unable to load inventory snapshot', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  const getAvailability = useCallback(
    (posterId: string, editionId?: string | null) => {
      if (!snapshot) {
        return null;
      }

      const key = resolveInventoryKey(posterId, editionId ?? null);
      return snapshot[key] ?? null;
    },
    [snapshot]
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      snapshot,
      isLoading,
      error,
      refresh: fetchSnapshot,
      getAvailability
    }),
    [snapshot, isLoading, error, fetchSnapshot, getAvailability]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
