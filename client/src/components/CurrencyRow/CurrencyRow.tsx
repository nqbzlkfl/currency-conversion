import { ReactNode } from 'react';
import { CurrencySelector } from '@/components/CurrencySelector';
import { AmountInput } from '@/components/AmountInput';
import styles from './CurrencyRow.module.css';

type CurrencyRowProps = {
  label: string;
  currencyCode: string;
  amountDisplay: string;
  isDropdownOpen?: boolean;
  isAmountReadOnly?: boolean;
  isFading?: boolean;
  onSelectorClick?: () => void;
  onAmountChange?: (display: string, numeric: number) => void;
  dropdownSlot?: ReactNode;
};
export function CurrencyRow({
  label,
  currencyCode,
  amountDisplay,
  isDropdownOpen = false,
  isAmountReadOnly = false,
  isFading = false,
  onSelectorClick,
  onAmountChange,
  dropdownSlot,
}: CurrencyRowProps) {
  const controlsClass = `${styles.controls} ${isFading ? styles.fadingControls : ''}`;
  return (
    <div className={styles.row}>
      <div className={styles.label}>{label}</div>
      <div
        className={controlsClass}
        key={isFading ? 'fading' : 'idle'}
      >
        <div className={styles.selectorHost}>
          <CurrencySelector
            currencyCode={currencyCode}
            isOpen={isDropdownOpen}
            onClick={onSelectorClick}
          />
          {dropdownSlot}
        </div>
        <AmountInput
          value={amountDisplay}
          readOnly={isAmountReadOnly}
          onValueChange={onAmountChange}
          ariaLabel={`${label} in ${currencyCode}`}
        />
      </div>
    </div>
  );
}
