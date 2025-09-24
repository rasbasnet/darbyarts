import { loadStripe, Stripe } from '@stripe/stripe-js';

const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL ?? '').replace(/\/$/, '');

export type StripeCheckoutItem = {
  posterId: string;
  quantity: number;
};

export type StripeCheckoutRequest = {
  items: StripeCheckoutItem[];
};

type StripeCheckoutResponse = {
  sessionId?: string;
  error?: string;
};

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!publishableKey) {
    throw new Error('Stripe publishable key is not configured.');
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

export const beginStripeCheckout = async ({ items }: StripeCheckoutRequest) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No items provided for checkout.');
  }

  const stripe = await getStripe();

  if (!stripe) {
    throw new Error('Unable to initialise Stripe.');
  }

  const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/stripe/create-checkout-session` : '/api/stripe/create-checkout-session';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('Payment service returned an unexpected response. Please try again later.');
  }

  const data = (await response.json()) as StripeCheckoutResponse;

  if (!response.ok || !data.sessionId) {
    throw new Error(data.error ?? 'Unable to create Stripe checkout session.');
  }

  const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });

  if (result.error) {
    throw new Error(result.error.message);
  }
};
