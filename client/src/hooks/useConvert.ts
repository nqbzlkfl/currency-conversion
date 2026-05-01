import { useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';
import { CONVERT_DEBOUNCE_MS } from '@/helpers/constants';
import { useDebouncedEffect } from './useDebouncedEffect';

type ConvertStatus = 'idle' | 'loading' | 'success' | 'error';

export type UseConvertResult = {
  result: number | null;
  rate: number | null;
  status: ConvertStatus;
  error: string | null;
};

type UseConvertOptions = {
  immediate?: boolean;
  epoch?: number;
};

export function useConvert(
  from: string,
  to: string,
  amount: number,
  options: UseConvertOptions = {},
): UseConvertResult {
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [status, setStatus] = useState<ConvertStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const requestToken = useRef(0);

  const runConvert = () => {
    if (!from || !to) return;
    const myToken = ++requestToken.current;
    setStatus('loading');
    setError(null);

    api
      .convert(from, to, amount)
      .then((response) => {
        if (myToken !== requestToken.current) return;
        setResult(response.result);
        setRate(response.rate);
        setStatus('success');
      })
      .catch((err: Error) => {
        if (myToken !== requestToken.current) return;
        setResult(null);
        setRate(null);
        setError(err.message);
        setStatus('error');
      });
  };

  useDebouncedEffect(
    () => {
      if (!options.immediate) runConvert();
    },
    CONVERT_DEBOUNCE_MS,
    [from, to, amount],
  );

  useEffect(() => {
    if (options.immediate) runConvert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.immediate, options.epoch]);

  return { result, rate, status, error };
}
