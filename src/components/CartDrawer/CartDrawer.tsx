import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { POSTERS_SALES_ENABLED } from '../../config/features';
import { formatCurrency } from '../../utils/formatCurrency';
import { resolveAssetPath } from '../../utils/media';
import styles from './CartDrawer.module.css';

const CartDrawer = () => {
  const {
    items,
    subtotalCents,
    removeFromCart,
    updateQuantity,
    beginCheckout,
    isCheckoutLoading,
    error,
    dismissError,
    isDrawerOpen,
    closeDrawer
  } = useCart();

  const hasItems = items.length > 0;
  const [localErrorDismissed, setLocalErrorDismissed] = useState(false);

  useEffect(() => {
    if (error) {
      setLocalErrorDismissed(false);
    }
  }, [error]);

  const subtotalDisplay = useMemo(() => {
    const currency = items[0]?.currency ?? 'usd';
    return formatCurrency(subtotalCents / 100, currency);
  }, [items, subtotalCents]);

  const isSalesEnabled = POSTERS_SALES_ENABLED;

  const closeAndReset = () => {
    setLocalErrorDismissed(false);
    closeDrawer();
  };

  const visibleError = !localErrorDismissed ? error : null;

  return (
    <aside className={`${styles.drawer} ${isDrawerOpen ? styles.open : ''}`} aria-live="polite">
      <div className={styles.header}>
        <h2>Cart</h2>
        <button type="button" className={styles.closeButton} onClick={closeAndReset} aria-label="Close cart">
          ×
        </button>
      </div>

      {visibleError ? (
        <div className={styles.error} role="alert">
          <span>{visibleError}</span>
          <button type="button" onClick={() => { dismissError(); setLocalErrorDismissed(true); }} aria-label="Dismiss error">
            ×
          </button>
        </div>
      ) : null}

      <div className={styles.items}>
        {hasItems ? (
          items.map((poster) => (
            <div key={poster.id} className={styles.item}>
              <div className={styles.itemMedia}>
                <img src={resolveAssetPath(poster.image)} alt={poster.title} />
              </div>

              <div className={styles.itemContent}>
                <h3>{poster.title}</h3>
                {poster.edition ? <p className={styles.itemEdition}>{poster.edition.label}</p> : null}
                <p className={styles.itemPrice}>{formatCurrency(poster.unitPriceCents / 100, poster.currency)}</p>

                <div className={styles.quantityRow}>
                  <label htmlFor={`cart-qty-${poster.id}`}>Qty</label>
                  <input
                    id={`cart-qty-${poster.id}-${poster.edition?.id ?? 'default'}`}
                    type="number"
                    min={1}
                    value={poster.quantity}
                    onChange={(event) => {
                      const next = Number(event.currentTarget.value);
                      if (Number.isFinite(next)) {
                        updateQuantity(poster.id, poster.edition?.id ?? null, next);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeFromCart(poster.id, poster.edition?.id ?? null)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.empty}>Your cart is empty. Add a poster to get started.</p>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.subtotalRow}>
          <span>Subtotal</span>
          <strong>{subtotalDisplay}</strong>
        </div>
        <Link to="/posters" className={styles.secondaryButton} onClick={closeDrawer}>
          Browse items for sale
        </Link>
        <button
          type="button"
          className={styles.checkoutButton}
          onClick={beginCheckout}
          disabled={!hasItems || isCheckoutLoading || !isSalesEnabled}
        >
          {isSalesEnabled ? (isCheckoutLoading ? 'Processing…' : 'Checkout with Stripe') : 'Coming soon'}
        </button>
      </div>
    </aside>
  );
};

export default CartDrawer;
