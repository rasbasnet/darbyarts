import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SectionHeader from '../../../components/SectionHeader/SectionHeader';
import { CART_BACKUP_KEY, useCart } from '../../../context/CartContext';
import { profile } from '../../../data/profile';
import { formatCurrency } from '../../../utils/formatCurrency';
import styles from './CheckoutResult.module.css';

type SessionLineItem = {
  id: string;
  quantity: number;
  amountSubtotal: number;
  amountTotal: number;
  currency: string;
  description?: string | null;
  product?: {
    id: string;
    name: string;
    images?: string[];
  } | null;
};

type SessionSummary = {
  id: string;
  status: string | null;
  paymentStatus: string | null;
  amountTotal: number | null;
  currency: string | null;
  customerEmail: string | null;
  customerName: string | null;
  lineItems: SessionLineItem[];
  metadata?: Record<string, string> | null;
  paymentIntentId?: string | null;
};

const CheckoutResult = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status') ?? params.get('checkout');
  const sessionId = params.get('session_id');
  const { clearCart, replaceCart } = useCart();
  const [isLoading, setLoading] = useState(Boolean(sessionId));
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionSummary | null>(null);

  useEffect(() => {
    if (!status) {
      navigate('/posters', { replace: true });
    }
  }, [navigate, status]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      navigate('/posters', { replace: true });
      return;
    }

    const controller = new AbortController();

    const fetchSession = async () => {
      try {
        const baseUrl = (process.env.REACT_APP_API_BASE_URL ?? '').replace(/\/$/, '');
        const endpoint = baseUrl
          ? `${baseUrl}/api/stripe/checkout-session/${sessionId}`
          : `/api/stripe/checkout-session/${sessionId}`;

        const response = await fetch(endpoint, { signal: controller.signal });

        if (!response.ok) {
          throw new Error('Unable to retrieve checkout summary.');
        }

        const data = await response.json();
        setSessionDetails(data);

        if (status === 'success') {
          clearCart();
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSessionError(error instanceof Error ? error.message : 'Unable to retrieve checkout summary.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    return () => controller.abort();
  }, [clearCart, navigate, sessionId, status]);

  useEffect(() => {
    if (!sessionDetails || status !== 'cancelled') {
      return;
    }

    let restored = false;
    const rawMetadata = sessionDetails.metadata?.items;

    if (rawMetadata) {
      try {
        const parsed = JSON.parse(rawMetadata);
        if (Array.isArray(parsed)) {
          const entries = parsed
            .map((entry: any) => {
              if (!entry || typeof entry.posterId !== 'string') {
                return null;
              }
              const qtyNumber = Number(entry.quantity);
              if (!Number.isFinite(qtyNumber) || qtyNumber < 1) {
                return null;
              }
              const editionId = typeof entry.editionId === 'string' ? entry.editionId : null;
              return { posterId: entry.posterId, editionId, quantity: qtyNumber };
            })
            .filter(Boolean) as { posterId: string; editionId: string | null; quantity: number }[];

          if (entries.length) {
            replaceCart(entries);
            restored = true;
          }
        }
      } catch (parseError) {
        console.error('Unable to parse Stripe metadata', parseError);
      }
    }

    if (!restored && typeof window !== 'undefined') {
      try {
        const backup = window.sessionStorage.getItem(CART_BACKUP_KEY);
        if (backup) {
          const parsed = JSON.parse(backup);
          if (Array.isArray(parsed)) {
            const entries = parsed
              .map((entry: any) => {
                if (!entry || typeof entry.posterId !== 'string') {
                  return null;
                }
                const qty = Number(entry.quantity);
                if (!Number.isFinite(qty) || qty < 1) {
                  return null;
                }
                const editionId = typeof entry.editionId === 'string' ? entry.editionId : null;
                return { posterId: entry.posterId, editionId, quantity: qty };
              })
              .filter(Boolean) as { posterId: string; editionId: string | null; quantity: number }[];

          if (entries.length) {
            replaceCart(entries);
            }
          }
        }
      } catch (storageError) {
        console.error('Unable to restore cart from storage', storageError);
      }
    }
  }, [replaceCart, sessionDetails, status]);

  const isSuccess = status === 'success';

  const currency = sessionDetails?.currency ?? 'usd';
  const totalFormatted = useMemo(
    () => (sessionDetails?.amountTotal != null ? formatCurrency(sessionDetails.amountTotal / 100, currency) : null),
    [currency, sessionDetails?.amountTotal]
  );

  const lineItems = sessionDetails?.lineItems ?? [];
  const customerEmail = sessionDetails?.customerEmail ?? profile.contact.email;
  const supportLink = `mailto:${profile.contact.email}`;
  const paymentIntentId = sessionDetails?.paymentIntentId ?? null;

  const badgeClass = sessionError
    ? `${styles.statusBadge} ${styles.statusBadgeWarning}`
    : isLoading
      ? `${styles.statusBadge} ${styles.statusBadgeInfo}`
      : isSuccess
        ? `${styles.statusBadge} ${styles.statusBadgeSuccess}`
        : `${styles.statusBadge} ${styles.statusBadgeWarning}`;

  const badgeLabel = sessionError
    ? 'Unable to load receipt'
    : isLoading
      ? 'Processing checkout'
      : isSuccess
        ? 'Payment received'
        : 'Payment incomplete';

  const orderTitle = isSuccess ? 'Order summary' : 'Checkout summary';
  const totalLabel = isSuccess ? 'Total paid' : 'Cart total';

  const secondaryAction = isSuccess || sessionError ? (
    <a href={supportLink} className={styles.secondaryButton}>
      Email the studio
    </a>
  ) : (
    <Link to="/posters?cart=open" className={styles.secondaryButton}>
      Review cart
    </Link>
  );

  const renderStatusCopy = () => {
    if (isLoading) {
      return <p className={styles.loading}>Loading your order summary…</p>;
    }

    if (sessionError) {
      return (
        <>
          <p className={styles.error}>{sessionError}</p>
          <p>
            Need a hand? Email <a href={supportLink}>{profile.contact.email}</a> and include your checkout reference.
          </p>
        </>
      );
    }

    if (isSuccess) {
      return (
        <>
          <p>
            A confirmation email is on its way to <strong>{customerEmail}</strong> with your receipt and shipping
            details. Posters ship rolled in archival tubes within 10 business days.
          </p>
          <p>We’ll send tracking information as soon as your order leaves the studio.</p>
        </>
      );
    }

    return (
      <>
        <p>
          Your payment was cancelled before completion. Your cart has been restored so you can review the items and try
          again when you’re ready.
        </p>
      </>
    );
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <SectionHeader
            overline={isSuccess ? 'Thank you' : 'Checkout update'}
            title={isSuccess ? 'Order confirmed' : 'Unable to complete checkout'}
            description={
              isSuccess
                ? 'Your poster order is on its way. A receipt has been emailed to you with tracking details to follow.'
                : 'Your payment was not completed. You can revisit your cart to review items and try again.'
            }
            align="center"
          />
        </div>
      </section>
      <section className={styles.summarySection}>
        <div className={`container ${styles.summaryLayout}`}>
          <div className={`${styles.card} ${styles.orderCard}`}>
            <div className={styles.statusHeader}>
              <span className={badgeClass}>{badgeLabel}</span>
              {paymentIntentId ? <span className={styles.reference}>Ref: {paymentIntentId}</span> : null}
            </div>

            <div className={styles.statusBody}>{renderStatusCopy()}</div>

            {!isLoading && !sessionError ? (
              <>
                <div className={styles.orderHeading}>
                  <h3>{orderTitle}</h3>
                </div>

                {lineItems.length ? (
                  <ul className={styles.orderList}>
                    {lineItems.map((item) => {
                      const name = item.product?.name ?? item.description ?? 'Poster';
                      const quantity = Math.max(1, item.quantity ?? 1);
                      const subtotalCents = item.amountSubtotal ?? item.amountTotal ?? 0;
                      const totalCents = item.amountTotal ?? item.amountSubtotal ?? 0;
                      const currencyCode = item.currency ?? currency;
                      const unitCents = quantity > 0 ? subtotalCents / quantity : subtotalCents;
                      const unitLabel = formatCurrency(unitCents / 100, currencyCode);
                      const lineTotalLabel = formatCurrency(totalCents / 100, currencyCode);

                      return (
                        <li key={item.id} className={styles.orderLine}>
                          <div>
                            <span className={styles.orderLineTitle}>{name}</span>
                            <div className={styles.orderLineMeta}>
                              {quantity} × {unitLabel}
                            </div>
                          </div>
                          <span className={styles.orderLineTotal}>{lineTotalLabel}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={styles.orderEmpty}>No items were captured for this checkout.</p>
                )}

                {totalFormatted ? (
                  <div className={styles.orderFooter}>
                    <span>{totalLabel}</span>
                    <strong>{totalFormatted}</strong>
                  </div>
                ) : null}

                <div className={styles.orderMeta}>
                  {customerEmail ? (
                    <span>
                      {
                        isSuccess && `Receipt sent to `
                      }
                      {
                        isSuccess && <strong>{customerEmail}</strong>
                      }
                    </span>
                  ) : null}
                  <a href={supportLink}>Need help? Email the studio</a>
                </div>
              </>
            ) : null}

            <div className={styles.actions}>
              <Link to="/posters" className={styles.primaryButton}>
                {isSuccess ? 'Browse more posters' : 'Return to posters'}
              </Link>
              {secondaryAction}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CheckoutResult;
