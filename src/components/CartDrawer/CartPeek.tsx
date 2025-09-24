import { useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import styles from './CartPeek.module.css';

const CartPeek = () => {
  const { items, subtotalCents, isDrawerOpen, openDrawer } = useCart();

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(() => {
    const currency = items[0]?.currency ?? 'usd';
    return formatCurrency(subtotalCents / 100, currency);
  }, [items, subtotalCents]);

  if (!items.length || isDrawerOpen) {
    return null;
  }

  return (
    <button type="button" className={styles.peek} onClick={openDrawer}>
      <span>Cart · {totalQuantity} item{totalQuantity === 1 ? '' : 's'}</span>
      <strong>{subtotal}</strong>
    </button>
  );
};

export default CartPeek;
