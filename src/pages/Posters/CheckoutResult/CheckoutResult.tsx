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
              if (!Array.isArray(entry) || entry.length < 2) {
                return null;
              }
              const [posterId, quantity] = entry;
              if (typeof posterId !== 'string') {
                return null;
              }
              const qtyNumber = Number(quantity);
              if (!Number.isFinite(qtyNumber) || qtyNumber < 1) {
                return null;
              }
              return { posterId, quantity: qtyNumber };
            })
            .filter(Boolean) as { posterId: string; quantity: number }[];

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
                return { posterId: entry.posterId, quantity: qty };
              })
              .filter(Boolean) as { posterId: string; quantity: number }[];

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
            .map((entry: unknown) => {
              if (!Array.isArray(entry) || entry.length < 2) {
                return null;
              }
              const [posterId, quantity] = entry;
              if (typeof posterId !== 'string') {
                return null;
              }
              const qtyNumber = Number(quantity);
              if (!Number.isFinite(qtyNumber) || qtyNumber < 1) {
                return null;
              }
              return { posterId, quantity: qtyNumber };
            })
            .filter(Boolean) as { posterId: string; quantity: number }[];

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
                return { posterId: entry.posterId, quantity: qty };
              })
              .filter(Boolean) as { posterId: string; quantity: number }[];

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

      <section>
        <div className="container">
          <div className={styles.summary}>
            {isLoading ? (
              <p>Loading your order summary…</p>
            ) : sessionError ? (
              <p>{sessionError}</p>
            ) : (
              <>
                {isSuccess ? (
                  <>
                    <p>
                      A confirmation email is being sent to <strong>{customerEmail}</strong> with your receipt and
                      shipping details. Posters ship rolled in archival tubes within 10 business days.
                    </p>
                    {totalFormatted ? <p>Total paid: <strong>{totalFormatted}</strong></p> : null}
                  </>
                ) : (
                  <>
                    <p>
                      Your payment was cancelled before completion. You can reopen your cart to review the items and try
                      again, or contact us if you need assistance.
                    </p>
                    {customerEmail ? (
                      <p>We reserved your cart for <strong>{customerEmail}</strong> for a short time.</p>
                    ) : null}
                  </>
                )}

                {lineItems.length ? (
                  <ul className={styles.lineItems}>
                    {lineItems.map((item) => {
                      const name = item.product?.name ?? item.description ?? 'Poster';
                      const qty = item.quantity ?? 1;
                      const lineTotal = formatCurrency(((item.amountTotal ?? item.amountSubtotal ?? 0) / 100), item.currency ?? currency);

                      return (
                        <li key={item.id}>
                          <span>{name}</span>
                          <span>{qty} × {formatCurrency((item.amountSubtotal ?? 0) / 100, item.currency ?? currency)}</span>
                          <strong>{lineTotal}</strong>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                <p>
                  Have a question about your order? Email{' '}
                  <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a> and include your order
                  reference.
                </p>
              </>
            )}
          </div>

          <div className={styles.actions}>
            <Link to="/posters" className={styles.primaryButton}>
              {isSuccess ? 'Browse more posters' : 'Return to posters'}
            </Link>
            {isSuccess ? (
              <a href={`mailto:${profile.contact.email}`} className={styles.secondaryButton}>
                Email the studio
              </a>
            ) : (
              <Link to="/posters?cart=open" className={styles.secondaryButton}>
                Review cart
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CheckoutResult;
