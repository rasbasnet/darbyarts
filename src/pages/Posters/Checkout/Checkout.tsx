import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import SectionHeader from '../../../components/SectionHeader/SectionHeader';
import { CheckoutContact, useCart } from '../../../context/CartContext';
import { formatCurrency } from '../../../utils/formatCurrency';
import { resolveAssetPath } from '../../../utils/media';
import styles from './Checkout.module.css';

const CHECKOUT_CONTACT_KEY = 'darbymitchell-checkout-contact-details';

const baseContact: CheckoutContact = {
  name: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'US'
};

const getInitialContact = (): CheckoutContact => {
  if (typeof window === 'undefined') {
    return baseContact;
  }

  try {
    const stored = window.sessionStorage.getItem(CHECKOUT_CONTACT_KEY);
    if (!stored) {
      return baseContact;
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      return baseContact;
    }

    return {
      ...baseContact,
      ...Object.keys(baseContact).reduce((accumulator, key) => {
        const value = parsed[key as keyof CheckoutContact];
        if (typeof value === 'string') {
          accumulator[key as keyof CheckoutContact] = value;
        }
        return accumulator;
      }, {} as Partial<CheckoutContact>)
    } as CheckoutContact;
  } catch (error) {
    console.warn('Unable to restore checkout details', error);
    return baseContact;
  }
};

const allowedCountries = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' }
];

const Checkout = () => {
  const {
    items,
    subtotalCents,
    updateQuantity,
    removeFromCart,
    beginCheckout,
    isCheckoutLoading,
    error,
    dismissError
  } = useCart();
  const navigate = useNavigate();

  const [contact, setContact] = useState<CheckoutContact>(getInitialContact);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutContact, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!items.length && !isCheckoutLoading) {
      navigate('/posters', { replace: true });
    }
  }, [isCheckoutLoading, items.length, navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.sessionStorage.setItem(CHECKOUT_CONTACT_KEY, JSON.stringify(contact));
    } catch (storageError) {
      console.warn('Unable to persist checkout contact details', storageError);
    }
  }, [contact]);

  const subtotalDisplay = useMemo(() => {
    const currency = items[0]?.currency ?? 'usd';
    return formatCurrency(subtotalCents / 100, currency);
  }, [items, subtotalCents]);

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const handleFieldChange = (field: keyof CheckoutContact) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    setContact((current) => ({
      ...current,
      [field]: value
    }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (error) {
      dismissError();
    }
  };

  const validateContact = (details: CheckoutContact) => {
    const errors: Partial<Record<keyof CheckoutContact, string>> = {};
    const required: Array<keyof CheckoutContact> = [
      'name',
      'email',
      'addressLine1',
      'city',
      'region',
      'postalCode',
      'country'
    ];

    for (const field of required) {
      const value = details[field];
      if (!value || !value.trim()) {
        errors[field] = 'Required';
      }
    }

    if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      errors.email = 'Enter a valid email';
    }

    if (details.country && !allowedCountries.some((country) => country.code === details.country.toUpperCase())) {
      errors.country = 'Currently shipping to US or CA';
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!items.length) {
      setFormError('Add a poster to your cart before checking out.');
      return;
    }

    const trimmedContact: CheckoutContact = {
      ...contact,
      name: contact.name.trim(),
      email: contact.email.trim(),
      addressLine1: contact.addressLine1.trim(),
      addressLine2: contact.addressLine2?.trim() ?? '',
      city: contact.city.trim(),
      region: contact.region.trim(),
      postalCode: contact.postalCode.trim(),
      country: contact.country.trim().toUpperCase()
    };

    const validationErrors = validateContact(trimmedContact);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFormError('Fill in your shipping details to continue.');
      return;
    }

    setFormError(null);

    if (error) {
      dismissError();
    }

    await beginCheckout(trimmedContact);
  };

  if (!items.length && !isCheckoutLoading) {
    return <Navigate to="/posters" replace />;
  }

  const currency = items[0]?.currency ?? 'usd';

  return (
    <div className={styles.page}>
      <section className={styles.headerBand}>
        <div className="container">
          <SectionHeader
            overline="Checkout"
            title="Confirm your studio edition"
            description="Review your cart, add shipping details, and complete secure payment through Stripe."
            tone="light"
          />
        </div>
      </section>

      <section className={styles.checkoutSection}>
        <div className={`container ${styles.layout}`}>
          <div className={styles.formPanel}>
            <form onSubmit={handleSubmit} noValidate>
              <fieldset disabled={isCheckoutLoading}>
                <legend>Shipping information</legend>

                <div className={styles.formGrid}>
                  <label className={styles.formField} htmlFor="shipping-name">
                    <span>Full name</span>
                    <input
                      id="shipping-name"
                      type="text"
                      autoComplete="name"
                      value={contact.name}
                      onChange={handleFieldChange('name')}
                      aria-invalid={fieldErrors.name ? 'true' : undefined}
                    />
                    {fieldErrors.name ? <span className={styles.fieldError}>{fieldErrors.name}</span> : null}
                  </label>

                  <label className={styles.formField} htmlFor="shipping-email">
                    <span>Email address</span>
                    <input
                      id="shipping-email"
                      type="email"
                      autoComplete="email"
                      value={contact.email}
                      onChange={handleFieldChange('email')}
                      aria-invalid={fieldErrors.email ? 'true' : undefined}
                    />
                    {fieldErrors.email ? <span className={styles.fieldError}>{fieldErrors.email}</span> : null}
                  </label>

                  <label className={styles.formField} htmlFor="shipping-address1">
                    <span>Street address</span>
                    <input
                      id="shipping-address1"
                      type="text"
                      autoComplete="address-line1"
                      value={contact.addressLine1}
                      onChange={handleFieldChange('addressLine1')}
                      aria-invalid={fieldErrors.addressLine1 ? 'true' : undefined}
                    />
                    {fieldErrors.addressLine1 ? <span className={styles.fieldError}>{fieldErrors.addressLine1}</span> : null}
                  </label>

                  <label className={styles.formField} htmlFor="shipping-address2">
                    <span>Apartment, suite (optional)</span>
                    <input
                      id="shipping-address2"
                      type="text"
                      autoComplete="address-line2"
                      value={contact.addressLine2 ?? ''}
                      onChange={handleFieldChange('addressLine2')}
                    />
                  </label>

                  <label className={styles.formField} htmlFor="shipping-city">
                    <span>City</span>
                    <input
                      id="shipping-city"
                      type="text"
                      autoComplete="address-level2"
                      value={contact.city}
                      onChange={handleFieldChange('city')}
                      aria-invalid={fieldErrors.city ? 'true' : undefined}
                    />
                    {fieldErrors.city ? <span className={styles.fieldError}>{fieldErrors.city}</span> : null}
                  </label>

                  <label className={styles.formField} htmlFor="shipping-region">
                    <span>State / Province</span>
                    <input
                      id="shipping-region"
                      type="text"
                      autoComplete="address-level1"
                      value={contact.region}
                      onChange={handleFieldChange('region')}
                      aria-invalid={fieldErrors.region ? 'true' : undefined}
                    />
                    {fieldErrors.region ? <span className={styles.fieldError}>{fieldErrors.region}</span> : null}
                  </label>

                  <label className={styles.formField} htmlFor="shipping-postal">
                    <span>Postal code</span>
                    <input
                      id="shipping-postal"
                      type="text"
                      autoComplete="postal-code"
                      value={contact.postalCode}
                      onChange={handleFieldChange('postalCode')}
                      aria-invalid={fieldErrors.postalCode ? 'true' : undefined}
                    />
                    {fieldErrors.postalCode ? <span className={styles.fieldError}>{fieldErrors.postalCode}</span> : null}
                  </label>

                  <label className={styles.formField} htmlFor="shipping-country">
                    <span>Country</span>
                    <select
                      id="shipping-country"
                      value={contact.country}
                      onChange={handleFieldChange('country')}
                      aria-invalid={fieldErrors.country ? 'true' : undefined}
                      autoComplete="country"
                    >
                      {allowedCountries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.country ? <span className={styles.fieldError}>{fieldErrors.country}</span> : null}
                  </label>
                </div>
              </fieldset>

              <div className={styles.formFooter}>
                {formError ? <p className={styles.formError}>{formError}</p> : null}
                {error ? (
                  <div className={styles.contextError} role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={dismissError} aria-label="Dismiss error">
                      ×
                    </button>
                  </div>
                ) : null}
                <button type="submit" className={styles.primaryButton} disabled={isCheckoutLoading || !items.length}>
                  {isCheckoutLoading ? 'Redirecting to Stripe…' : 'Checkout with Stripe'}
                </button>
              </div>
            </form>

            <p className={styles.privacyNote}>
              Your payment is processed securely via Stripe. Shipping address is used exclusively for fulfilment and
              delivery updates.
            </p>
          </div>

          <aside className={styles.summaryPanel} aria-label="Order summary">
            <header>
              <h2>Order summary</h2>
              <p>
                {totalQuantity} item{totalQuantity === 1 ? '' : 's'} · {subtotalDisplay}
              </p>
            </header>

            <ul className={styles.itemList}>
              {items.map((poster) => (
                <li key={`${poster.id}-${poster.edition?.id ?? 'default'}`} className={styles.itemRow}>
                  <div className={styles.itemMedia}>
                    <img src={resolveAssetPath(poster.image)} alt={poster.title} />
                  </div>
                  <div className={styles.itemContent}>
                    <div>
                      <strong>{poster.title}</strong>
                      {poster.edition ? <span>{poster.edition.label}</span> : null}
                    </div>
                    <p>{formatCurrency(poster.unitPriceCents / 100, currency)}</p>
                    <div className={styles.controls}>
                      <label htmlFor={`checkout-qty-${poster.id}-${poster.edition?.id ?? 'default'}`}>Qty</label>
                      <input
                        id={`checkout-qty-${poster.id}-${poster.edition?.id ?? 'default'}`}
                        type="number"
                        min={1}
                        value={poster.quantity}
                        onChange={(event) => {
                          const value = Number(event.currentTarget.value);
                          if (Number.isFinite(value)) {
                            updateQuantity(poster.id, poster.edition?.id ?? null, value);
                          }
                        }}
                      />
                      <button type="button" onClick={() => removeFromCart(poster.id, poster.edition?.id ?? null)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.summaryTotals}>
              <div>
                <span>Subtotal</span>
                <strong>{subtotalDisplay}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>Calculated at payment</strong>
              </div>
            </div>

            <Link to="/posters" className={styles.secondaryLink}>
              Continue browsing posters
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Checkout;
