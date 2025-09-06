import { useProfile } from '@/hooks/useProfile';

export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', nameKey: 'currency_eur', symbol: '€' },
  { code: 'USD', nameKey: 'currency_usd', symbol: '$' },
  { code: 'GBP', nameKey: 'currency_gbp', symbol: '£' },
  { code: 'CAD', nameKey: 'currency_cad', symbol: 'C$' },
  { code: 'CHF', nameKey: 'currency_chf', symbol: 'CHF' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

/**
 * Get currency information by code
 */
export function getCurrencyInfo(code: string) {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code) || SUPPORTED_CURRENCIES[0];
}

/**
 * Format amount with the correct currency
 */
export function formatCurrency(amount: number, currencyCode: string = 'EUR'): string {
  const currency = getCurrencyInfo(currencyCode);

  // Use Intl.NumberFormat for proper formatting
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency is not supported by Intl
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Hook to get user's preferred currency
 */
export function useUserCurrency() {
  const { data: profileData } = useProfile();
  return profileData?.user?.currency || 'EUR';
}

/**
 * Hook to format currency with user's preferred currency
 */
export function useFormatCurrency() {
  const userCurrency = useUserCurrency();

  return (amount: number) => formatCurrency(amount, userCurrency);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrencyInfo(currencyCode);
  return currency.symbol;
}

/**
 * Format amount with just the symbol (for compact display)
 */
export function formatCurrencyCompact(amount: number, currencyCode: string = 'EUR'): string {
  const currency = getCurrencyInfo(currencyCode);

  // For symbols that go before the amount
  if (['$', '£', 'C$'].includes(currency.symbol)) {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }

  // For symbols that go after the amount (like € and CHF)
  return `${amount.toFixed(2)} ${currency.symbol}`;
}

/**
 * Hook to format currency compactly with user's preferred currency
 */
export function useFormatCurrencyCompact() {
  const userCurrency = useUserCurrency();

  return (amount: number) => formatCurrencyCompact(amount, userCurrency);
}
