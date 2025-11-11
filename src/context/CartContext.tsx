import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Poster, PosterEdition, getPosterById } from '../data/posters';
import { POSTERS_SALES_ENABLED } from '../config/features';
import type { InventoryShortage } from '../services/inventory';

type CartLineItem = {
  posterId: string;
  editionId?: string | null;
  quantity: number;
};

type CartPoster = Poster & {
  quantity: number;
  edition?: PosterEdition;
  unitPriceCents: number;
};

export const CART_BACKUP_KEY = 'darbymitchell-cart-backup';

const formatInventoryShortageMessage = (shortages?: InventoryShortage[]) => {
  if (!shortages?.length) {
    return null;
  }

  const [primary] = shortages;
  const source = primary.sources?.[0];
  const available = Number.isFinite(primary.available) ? Math.max(0, Math.floor(primary.available)) : 0;

  if (!source?.posterId) {
    if (available <= 0) {
      return 'One of your selected editions just sold out. Please remove it from your cart to continue.';
    }
    return available === 1
      ? 'Only one copy of a selected edition remains. Reduce your quantity and try again.'
      : `Only ${available} copies remain for one of your selections. Update your cart and try again.`;
  }

  const poster = getPosterById(source.posterId);
  const edition = poster?.editions?.find((entry) => entry.id === source.editionId);
  const targetName = edition ? `${poster?.title ?? 'Selected poster'} — ${edition.label}` : poster?.title ?? 'Selected poster';

  if (available <= 0) {
    return `${targetName} just sold out. Please remove it from your cart to continue.`;
  }

  return available === 1
    ? `Only one copy of ${targetName} remains. Update your quantity and try again.`
    : `Only ${available} copies of ${targetName} remain. Update your cart and try again.`;
};

type CartContextValue = {
  items: CartPoster[];
  addToCart: (posterId: string, editionId?: string | null, quantity?: number) => void;
  removeFromCart: (posterId: string, editionId?: string | null) => void;
  updateQuantity: (posterId: string, editionId: string | null, quantity: number) => void;
  clearCart: () => void;
  replaceCart: (entries: CartLineItem[]) => void;
  subtotalCents: number;
  beginCheckout: () => Promise<void>;
  isCheckoutLoading: boolean;
  error: string | null;
  dismissError: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const location = useLocation();
  const [lines, setLines] = useState<CartLineItem[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isCheckoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('cart') === 'open') {
      setDrawerOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.sessionStorage.getItem(CART_BACKUP_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return;
      }

      const entries = parsed
        .map((item: any) => {
          if (!item || typeof item.posterId !== 'string') {
            return null;
          }
          const qty = Number(item.quantity);
          if (!Number.isFinite(qty) || qty < 1) {
            return null;
          }
          const editionId = typeof item.editionId === 'string' ? item.editionId : null;
          return {
            posterId: item.posterId,
            editionId,
            quantity: Math.max(1, Math.floor(qty))
          };
        })
        .filter(Boolean) as CartLineItem[];

      if (entries.length) {
        setLines(entries);
      }
    } catch (error) {
      console.error('Unable to restore cart from sessionStorage', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (lines.length) {
      window.sessionStorage.setItem(CART_BACKUP_KEY, JSON.stringify(lines));
    } else {
      window.sessionStorage.removeItem(CART_BACKUP_KEY);
    }
  }, [lines]);

  const enrichedItems = useMemo<CartPoster[]>(() =>
    lines
      .map((line) => {
        const poster = getPosterById(line.posterId);
        if (!poster) {
          return null;
        }

        const edition = poster.editions?.find((entry) => entry.id === line.editionId);
        if (poster.editions?.length && !edition) {
          return null;
        }

        const unitPriceCents = edition?.priceCents ?? poster.priceCents;

        return {
          ...poster,
          quantity: line.quantity,
          edition,
          unitPriceCents
        } as CartPoster;
      })
      .filter(Boolean) as CartPoster[],
  [lines]);

  const subtotalCents = useMemo(
    () => enrichedItems.reduce((total, poster) => total + poster.unitPriceCents * poster.quantity, 0),
    [enrichedItems]
  );

  const addToCart = (posterId: string, editionId: string | null = null, quantity = 1) => {
    if (!POSTERS_SALES_ENABLED) {
      setError('Poster sales are coming soon. Join the studio list to be notified.');
      setDrawerOpen(true);
      return;
    }

    if (quantity < 1) {
      return;
    }

    const poster = getPosterById(posterId);
    if (!poster) {
      setError('Poster could not be found.');
      return;
    }

    const requiresEdition = Array.isArray(poster.editions) && poster.editions.length > 0;
    if (requiresEdition && !editionId) {
      setError('Select an edition before adding to cart.');
      return;
    }

    const edition = poster.editions?.find((entry) => entry.id === editionId);
    if (requiresEdition && !edition) {
      setError('The selected edition is unavailable.');
      return;
    }

    setError(null);
    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const posterLimit = poster.maxQuantityPerOrder ?? Infinity;
    const editionLimit = poster.maxQuantityPerEdition ?? posterLimit;

    const editionLimitMessage =
      editionLimit === Infinity
        ? null
        : `Limit reached: only ${editionLimit === 1 ? '1' : editionLimit} per person for this edition.`;
    const posterLimitMessage =
      posterLimit === Infinity
        ? null
        : `Limit reached: only ${posterLimit === 1 ? '1' : posterLimit} per person for this poster.`;

    setLines((current) => {
      const editionKey = edition?.id ?? null;
      const totalForPoster = current.reduce(
        (sum, item) => (item.posterId === posterId ? sum + item.quantity : sum),
        0
      );
      const existing = current.find((item) => item.posterId === posterId && (item.editionId ?? null) === editionKey);
      if (existing) {
        const otherQuantity = totalForPoster - existing.quantity;
        if (editionLimit !== Infinity && existing.quantity >= editionLimit) {
          setError(editionLimitMessage ?? 'Limit reached for this edition.');
          return current;
        }

        if (posterLimit !== Infinity && otherQuantity >= posterLimit) {
          setError(posterLimitMessage ?? 'Limit reached for this poster.');
          return current;
        }

        const allowedByEdition =
          editionLimit === Infinity
            ? normalizedQuantity
            : Math.max(0, Math.min(normalizedQuantity, editionLimit - existing.quantity));
        if (allowedByEdition <= 0) {
          setError(editionLimitMessage ?? 'Limit reached for this edition.');
          return current;
        }

        const allowedByPoster =
          posterLimit === Infinity
            ? normalizedQuantity
            : Math.max(0, Math.min(normalizedQuantity, posterLimit - otherQuantity - existing.quantity));
        const allowableIncrease = Math.min(allowedByEdition, allowedByPoster);
        if (allowableIncrease <= 0) {
          setError(
            posterLimit !== Infinity && allowedByPoster <= 0
              ? posterLimitMessage ?? 'Limit reached for this poster.'
              : editionLimitMessage ?? 'Limit reached for this edition.'
          );
          return current;
        }
        const nextQuantity = existing.quantity + allowableIncrease;
        return current.map((item) =>
          item.posterId === posterId && (item.editionId ?? null) === editionKey
            ? { ...item, quantity: nextQuantity }
            : item
        );
      }
      if (posterLimit !== Infinity && totalForPoster >= posterLimit) {
        setError(posterLimitMessage ?? 'Limit reached for this poster.');
        return current;
      }

      const allowedByEdition =
        editionLimit === Infinity ? normalizedQuantity : Math.min(normalizedQuantity, editionLimit);
      const allowedByPoster =
        posterLimit === Infinity
          ? normalizedQuantity
          : Math.max(0, Math.min(normalizedQuantity, posterLimit - totalForPoster));
      const allowableQuantity = Math.min(allowedByEdition, allowedByPoster);
      if (allowableQuantity <= 0) {
        setError(
          posterLimit !== Infinity && allowedByPoster <= 0
            ? posterLimitMessage ?? 'Limit reached for this poster.'
            : editionLimitMessage ?? 'Limit reached for this edition.'
        );
        return current;
      }

      return [...current, { posterId, editionId: editionKey, quantity: allowableQuantity }];
    });

    setDrawerOpen(true);
  };

  const removeFromCart = (posterId: string, editionId: string | null = null) => {
    setLines((current) =>
      current.filter((item) => !(item.posterId === posterId && (item.editionId ?? null) === (editionId ?? null)))
    );
  };

  const updateQuantity = (posterId: string, editionId: string | null, quantity: number) => {
    const normalizedQuantity = Math.floor(quantity);
    const poster = getPosterById(posterId);
    const posterLimit = poster?.maxQuantityPerOrder ?? Infinity;
    const editionLimit = poster?.maxQuantityPerEdition ?? posterLimit;

    if (normalizedQuantity <= 0) {
      removeFromCart(posterId, editionId ?? null);
      return;
    }

    setLines((current) => {
      const editionKey = editionId ?? null;
      const otherQuantity = current.reduce(
        (sum, item) =>
          item.posterId === posterId && (item.editionId ?? null) !== editionKey ? sum + item.quantity : sum,
        0
      );

      return current.reduce<CartLineItem[]>((acc, item) => {
        if (item.posterId === posterId && (item.editionId ?? null) === editionKey) {
          const desired = Math.max(1, normalizedQuantity);
          const allowedByEdition = editionLimit === Infinity ? desired : Math.min(desired, editionLimit);
          const capacityByPoster =
            posterLimit === Infinity
              ? allowedByEdition
              : Math.min(allowedByEdition, Math.max(0, posterLimit - otherQuantity));

          if (capacityByPoster <= 0) {
            return acc;
          }

          acc.push({ ...item, quantity: capacityByPoster });
          return acc;
        }

        acc.push(item);
        return acc;
      }, []);
    });
  };

  const clearCart = useCallback(() => setLines([]), []);

  const replaceCart = useCallback((entries: CartLineItem[]) => {
    setLines(() => {
      const next: CartLineItem[] = [];

      entries.forEach(({ posterId, editionId, quantity }) => {
        const poster = getPosterById(posterId);
        if (!poster) {
          return;
        }

        const posterLimit = poster.maxQuantityPerOrder ?? Infinity;
        const editionLimit = poster.maxQuantityPerEdition ?? posterLimit;
        const normalizedQuantity = Math.max(1, Math.floor(quantity));

        if (normalizedQuantity <= 0) {
          return;
        }

        const edition = poster.editions?.length
          ? poster.editions.find((entry) => entry.id === editionId)
          : null;

        if (poster.editions?.length && !edition) {
          return;
        }

        const editionKey = edition?.id ?? null;
        const totalForPoster = next.reduce(
          (sum, item) => (item.posterId === poster.id ? sum + item.quantity : sum),
          0
        );
        const existing = next.find(
          (item) => item.posterId === poster.id && (item.editionId ?? null) === editionKey
        );

        if (existing) {
          const otherQuantity = totalForPoster - existing.quantity;
          const allowedByEdition =
            editionLimit === Infinity
              ? normalizedQuantity
              : Math.max(0, Math.min(normalizedQuantity, editionLimit - existing.quantity));
          const allowedByPoster =
            posterLimit === Infinity
              ? normalizedQuantity
              : Math.max(0, Math.min(normalizedQuantity, posterLimit - otherQuantity - existing.quantity));
          const allowableIncrease = Math.min(allowedByEdition, allowedByPoster);
          if (allowableIncrease > 0) {
            existing.quantity += allowableIncrease;
          }
          return;
        }

        if (posterLimit !== Infinity && totalForPoster >= posterLimit) {
          return;
        }

        const allowedByEdition =
          editionLimit === Infinity ? normalizedQuantity : Math.min(normalizedQuantity, editionLimit);
        const allowedByPoster =
          posterLimit === Infinity
            ? normalizedQuantity
            : Math.max(0, Math.min(normalizedQuantity, posterLimit - totalForPoster));
        const allowableQuantity = Math.min(allowedByEdition, allowedByPoster);

        if (allowableQuantity > 0) {
          next.push({ posterId: poster.id, editionId: editionKey, quantity: allowableQuantity });
        }
      });

      return next;
    });
    if (entries.length) {
      setDrawerOpen(true);
    }
  }, []);

  const beginCheckout = async () => {
    if (!POSTERS_SALES_ENABLED) {
      setError('Poster sales are coming soon. Thanks for your patience!');
      setDrawerOpen(true);
      return;
    }

    if (!enrichedItems.length) {
      setError('Add a poster to your cart before checking out.');
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const cartItems = enrichedItems.map((poster) => ({
        posterId: poster.id,
        editionId: poster.edition?.id ?? null,
        quantity: poster.quantity
      }));

      const { verifyInventory } = await import('../services/inventory');
      const availability = await verifyInventory(cartItems);

      if (!availability.ok) {
        const shortageMessage = formatInventoryShortageMessage(availability.shortages);
        setError(shortageMessage ?? 'One or more selected editions are sold out.');
        setDrawerOpen(true);
        return;
      }

      const { beginStripeCheckout } = await import('../services/payments');
      await beginStripeCheckout({
        items: cartItems
      });
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : 'Checkout failed. Please try again.';
      setError(message);
      setDrawerOpen(true);
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cart') === 'open') {
      setDrawerOpen(true);
    }
  }, []);

  const value: CartContextValue = {
    items: enrichedItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    replaceCart,
    subtotalCents,
    beginCheckout,
    isCheckoutLoading,
    error,
    dismissError: () => setError(null),
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
