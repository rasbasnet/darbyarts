import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Poster, PosterEdition, getPosterById } from '../data/posters';

export type CheckoutContact = {
  name: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

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

type CartContextValue = {
  items: CartPoster[];
  addToCart: (posterId: string, editionId?: string | null, quantity?: number) => void;
  removeFromCart: (posterId: string, editionId?: string | null) => void;
  updateQuantity: (posterId: string, editionId: string | null, quantity: number) => void;
  clearCart: () => void;
  replaceCart: (entries: CartLineItem[]) => void;
  subtotalCents: number;
  beginCheckout: (contact: CheckoutContact) => Promise<void>;
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

const US_POSTAL_PATTERN = /^\d{5}(?:-\d{4})?$/;
const CA_POSTAL_PATTERN = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

export const CartProvider = ({ children }: CartProviderProps) => {
  const [lines, setLines] = useState<CartLineItem[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isCheckoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const isCheckoutRoute = location.pathname.startsWith('/posters/checkout');

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
    const limit = poster.maxQuantityPerOrder ?? Infinity;

    setLines((current) => {
      const editionKey = edition?.id ?? null;
      const totalForPoster = current.reduce(
        (sum, item) => (item.posterId === posterId ? sum + item.quantity : sum),
        0
      );
      const existing = current.find((item) => item.posterId === posterId && (item.editionId ?? null) === editionKey);
      if (existing) {
        const otherQuantity = totalForPoster - existing.quantity;
        if (existing.quantity >= limit || otherQuantity >= limit) {
          setError(`Limit reached: only ${limit} per person for this poster.`);
          return current;
        }

        const allowableIncrease = limit === Infinity ? normalizedQuantity : Math.max(0, Math.min(normalizedQuantity, limit - otherQuantity - existing.quantity));
        if (allowableIncrease <= 0) {
          setError(`Limit reached: only ${limit} per person for this poster.`);
          return current;
        }
        const nextQuantity = existing.quantity + allowableIncrease;
        return current.map((item) =>
          item.posterId === posterId && (item.editionId ?? null) === editionKey
            ? { ...item, quantity: nextQuantity }
            : item
        );
      }
      if (limit !== Infinity && totalForPoster >= limit) {
        setError(`Limit reached: only ${limit} per person for this poster.`);
        return current;
      }

      const allowableQuantity = limit === Infinity ? normalizedQuantity : Math.min(normalizedQuantity, Math.max(0, limit - totalForPoster));
      if (allowableQuantity <= 0) {
        setError(`Limit reached: only ${limit} per person for this poster.`);
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
    const limit = poster?.maxQuantityPerOrder ?? Infinity;

    if (normalizedQuantity <= 0) {
      removeFromCart(posterId, editionId ?? null);
      return;
    }

    setLines((current) =>
      current.map((item) =>
        item.posterId === posterId && (item.editionId ?? null) === (editionId ?? null)
          ? { ...item, quantity: Math.min(normalizedQuantity, limit) }
          : item
      )
    );
  };

  const clearCart = useCallback(() => setLines([]), []);

  const replaceCart = useCallback((entries: CartLineItem[]) => {
    setLines(
      entries
        .map(({ posterId, editionId, quantity }) => {
          const poster = getPosterById(posterId);
          if (!poster) {
            return null;
          }

          const limit = poster.maxQuantityPerOrder ?? Infinity;
          const clampedQuantity = Math.min(Math.max(1, Math.floor(quantity)), limit);

          if (poster.editions?.length) {
            const edition = poster.editions.find((entry) => entry.id === editionId);
            if (!edition) {
              return null;
            }
            return { posterId, editionId: edition.id, quantity: clampedQuantity };
          }

          return { posterId, editionId: null, quantity: clampedQuantity };
        })
        .filter(Boolean) as CartLineItem[]
    );
    if (entries.length) {
      setDrawerOpen(true);
    }
  }, []);

  const beginCheckout = async (contact: CheckoutContact) => {
    if (!enrichedItems.length) {
      setError('Add a poster to your cart before checking out.');
      return;
    }

    const sanitize = (value: string) => value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const normalizedContact: CheckoutContact = {
      name: sanitize(contact.name ?? ''),
      email: sanitize(contact.email ?? '').toLowerCase(),
      addressLine1: sanitize(contact.addressLine1 ?? ''),
      addressLine2: sanitize(contact.addressLine2 ?? ''),
      city: sanitize(contact.city ?? ''),
      region: sanitize(contact.region ?? ''),
      postalCode: sanitize(contact.postalCode ?? ''),
      country: sanitize((contact.country ?? '').toUpperCase())
    };

    const requiredFields: Array<keyof CheckoutContact> = [
      'name',
      'email',
      'addressLine1',
      'city',
      'region',
      'postalCode',
      'country'
    ];

    for (const field of requiredFields) {
      if (!normalizedContact[field]) {
        setError('Enter your shipping address before checking out.');
        if (!isCheckoutRoute) {
          setDrawerOpen(true);
        }
        return;
      }
    }

    const allowedCountries = ['US', 'CA'];
    if (!allowedCountries.includes(normalizedContact.country)) {
      setError('Select a supported shipping country before checking out.');
      if (!isCheckoutRoute) {
        setDrawerOpen(true);
      }
      return;
    }

    if (!emailPattern.test(normalizedContact.email)) {
      setError('Enter a valid email address before checking out.');
      if (!isCheckoutRoute) {
        setDrawerOpen(true);
      }
      return;
    }

    if (normalizedContact.country === 'US') {
      normalizedContact.postalCode = normalizedContact.postalCode.replace(/\s+/g, '');
      if (!US_POSTAL_PATTERN.test(normalizedContact.postalCode)) {
        setError('Enter a valid US ZIP code before checking out.');
        if (!isCheckoutRoute) {
          setDrawerOpen(true);
        }
        return;
      }
    }

    if (normalizedContact.country === 'CA') {
      normalizedContact.postalCode = normalizedContact.postalCode.replace(/\s+/g, '').toUpperCase();
      if (!CA_POSTAL_PATTERN.test(normalizedContact.postalCode)) {
        setError('Enter a valid Canadian postal code before checking out.');
        if (!isCheckoutRoute) {
          setDrawerOpen(true);
        }
        return;
      }
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const { beginStripeCheckout } = await import('../services/payments');
      await beginStripeCheckout({
        items: enrichedItems.map((poster) => ({
          posterId: poster.id,
          editionId: poster.edition?.id ?? null,
          quantity: poster.quantity
        })),
        customer: normalizedContact
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
