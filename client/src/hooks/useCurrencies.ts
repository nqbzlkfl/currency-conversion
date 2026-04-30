import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Currency } from '@/types/api';

type CurrenciesStatus = 'idle' | 'loading' | 'success' | 'error';

export type UseCurrenciesResult = {
  currencies: Currency[];
  status: CurrenciesStatus;
  error: string | null;
};

export function useCurrencies(): UseCurrenciesResult {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [status, setStatus] = useState<CurrenciesStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);

    api
      .getCurrencies()
      .then((response) => {
        if (cancelled) return;
        setCurrencies(response.currencies);
        setStatus('success');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { currencies, status, error };
}
