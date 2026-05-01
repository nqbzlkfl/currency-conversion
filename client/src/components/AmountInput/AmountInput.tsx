import { ChangeEvent, FocusEvent, forwardRef, useState } from 'react';
import { formatAmount, formatAmountInput, parseAmount } from '@/helpers/format';
import styles from './AmountInput.module.css';

type AmountInputProps = {
  value: string;
  readOnly?: boolean;
  onValueChange?: (rawDisplay: string, numericValue: number) => void;
  ariaLabel?: string;
};

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  function AmountInput({ value, readOnly = false, onValueChange, ariaLabel }, ref) {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (readOnly || !onValueChange) return;
      const formatted = formatAmountInput(e.target.value);
      const numeric = parseAmount(formatted);
      onValueChange(formatted, numeric);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (readOnly || !onValueChange) return;
      const numeric = parseAmount(e.target.value);
      const normalised = formatAmount(numeric);
      onValueChange(normalised, numeric);
    };

    const displayValue = isFocused ? value : formatAmount(parseAmount(value));

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={styles.pill}
        value={displayValue}
        readOnly={readOnly}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        aria-readonly={readOnly}
      />
    );
  },
);
