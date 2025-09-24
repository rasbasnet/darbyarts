import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Poster, getPosterById } from '../data/posters';

type CartLineItem = {
  posterId: string;
  quantity: number;
};

type CartPoster = Poster & { quantity: number };

export const CART_BACKUP_KEY = 'darbymitchell-cart-backup';

type CartContextValue = {
  items: CartPoster[];
  addToCart: (posterId: string, quantity?: number) => void;
  removeFromCart: (posterId: string) => void;
  updateQuantity: (posterId: string, quantity: number) => void;
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
  const [lines, setLines] = useState<CartLineItem[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isCheckoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

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
        return poster ? { ...poster, quantity: line.quantity } : null;
      })
      .filter(Boolean) as CartPoster[],
  [lines]);

  const subtotalCents = useMemo(
    () => enrichedItems.reduce((total, poster) => total + poster.priceCents * poster.quantity, 0),
    [enrichedItems]
  );

  const addToCart = (posterId: string, quantity = 1) => {
    if (quantity < 1) {
      return;
    }

    const poster = getPosterById(posterId);
    if (!poster) {
      setError('Poster could not be found.');
      return;
    }

    setError(null);
    const normalizedQuantity = Math.max(1, Math.floor(quantity));

    setLines((current) => {
      const existing = current.find((item) => item.posterId === posterId);
      if (existing) {
        return current.map((item) =>
          item.posterId === posterId
            ? { ...item, quantity: item.quantity + normalizedQuantity }
            : item
        );
      }
      return [...current, { posterId, quantity: normalizedQuantity }];
    });

    setDrawerOpen(true);
  };

  const removeFromCart = (posterId: string) => {
    setLines((current) => current.filter((item) => item.posterId !== posterId));
  };

  const updateQuantity = (posterId: string, quantity: number) => {
    const normalizedQuantity = Math.floor(quantity);

    if (normalizedQuantity <= 0) {
      removeFromCart(posterId);
      return;
    }

    setLines((current) =>
      current.map((item) => (item.posterId === posterId ? { ...item, quantity: normalizedQuantity } : item))
    );
  };

  const clearCart = useCallback(() => setLines([]), []);

  const replaceCart = useCallback((entries: CartLineItem[]) => {
    setLines(
      entries
        .map(({ posterId, quantity }) => ({ posterId, quantity: Math.max(1, Math.floor(quantity)) }))
        .filter((entry) => Boolean(getPosterById(entry.posterId)))
    );
    if (entries.length) {
      setDrawerOpen(true);
    }
  }, []);

  const beginCheckout = async () => {
    if (!enrichedItems.length) {
      setError('Add a poster to your cart before checking out.');
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const { beginStripeCheckout } = await import('../services/payments');
      await beginStripeCheckout({
        items: enrichedItems.map((poster) => ({ posterId: poster.id, quantity: poster.quantity }))
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
