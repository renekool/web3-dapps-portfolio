'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

export interface PaymentParams {
  invoiceId: bigint;
  companyId: bigint;
  amount: bigint;
  merchant: string;
  redirect: string;
  isValid: boolean;
  isReady: boolean;
}

/**
 * Hook to parse and validate payment parameters from the URL.
 * Expected parameters: invoiceId, companyId, amount, merchant, redirect.
 *
 * isReady: false until after the first client-side mount. Prevents showing
 * InvalidScreen during SSR/hydration when searchParams may not yet be populated.
 */
export const usePaymentParams = (): PaymentParams => {
  const searchParams = useSearchParams();

  // Track whether the component has mounted on the client.
  // useSearchParams() may return an empty object during SSR/hydration;
  // we must not treat that as "invalid params" until we're mounted.
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Extract primitive values so useMemo recomputes on content changes,
  // not just on URLSearchParams object reference changes (same ref, different data
  // is the typical race condition in Next.js App Router hydration).
  const rawInvoiceId = searchParams.get('invoiceId');
  const rawCompanyId = searchParams.get('companyId');
  const rawAmount = searchParams.get('amount');
  const merchant = searchParams.get('merchant') || '';
  const redirect = searchParams.get('redirect') || 'http://localhost:7004';

  const parsed = useMemo(() => {
    try {
      if (!rawInvoiceId || !rawCompanyId || !rawAmount || !merchant) {
        return {
          invoiceId: 0n,
          companyId: 0n,
          amount: 0n,
          merchant,
          redirect,
          isValid: false,
        };
      }

      const invoiceId = BigInt(rawInvoiceId);
      const companyId = BigInt(rawCompanyId);
      const amount = BigInt(rawAmount);

      const isValid =
        merchant.startsWith('0x') &&
        merchant.length === 42 &&
        invoiceId >= 0n &&
        companyId >= 0n &&
        amount >= 0n;

      return { invoiceId, companyId, amount, merchant, redirect, isValid };
    } catch (error) {
      console.error('Error parsing payment parameters:', error);
      return {
        invoiceId: 0n,
        companyId: 0n,
        amount: 0n,
        merchant,
        redirect,
        isValid: false,
      };
    }
  }, [rawInvoiceId, rawCompanyId, rawAmount, merchant, redirect]);

  return { ...parsed, isReady };
};
