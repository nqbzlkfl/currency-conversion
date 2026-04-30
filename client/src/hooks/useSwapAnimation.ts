import { useCallback, useRef, useState } from 'react';
import { FADE_DURATION_MS, SWAP_TOTAL_MS } from '@/helpers/constants';

export type UseSwapAnimationResult = {
  isSwapping: boolean;
  triggerSwap: () => void;
};

type UseSwapAnimationOptions = {
  onMidpoint: () => void;
};

/**
 * Swap interaction timing:
 *   t=0ms     isSwapping = true (consumers start fade-out)
 *   t=300ms   onMidpoint() fires (parent flips state)
 *   t=600ms   isSwapping = false (consumers stop fade)
 *
 * The icon spin (900ms) is driven by CSS, independent of this hook.
 * A re-entrance guard ignores clicks during an active window.
 */
export function useSwapAnimation({
  onMidpoint,
}: UseSwapAnimationOptions): UseSwapAnimationResult {
  const [isSwapping, setIsSwapping] = useState(false);
  const isAnimatingRef = useRef(false);

  const triggerSwap = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsSwapping(true);

    const midpointHandle = window.setTimeout(() => {
      onMidpoint();
    }, FADE_DURATION_MS);

    const endHandle = window.setTimeout(() => {
      setIsSwapping(false);
      isAnimatingRef.current = false;
    }, SWAP_TOTAL_MS);

    return () => {
      window.clearTimeout(midpointHandle);
      window.clearTimeout(endHandle);
    };
  }, [onMidpoint]);

  return { isSwapping, triggerSwap };
}
