const formatters = new Map<string, Intl.NumberFormat>();

export const formatCurrency = (amount: number, currency: string) => {
  const key = currency.toLowerCase();
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase()
      })
    );
  }

  return formatters.get(key)!.format(amount);
};
