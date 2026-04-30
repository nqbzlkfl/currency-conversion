import { ChevronDown } from 'lucide-react';
import { Flag } from '@/components/Flag';
import styles from './CurrencySelector.module.css';

type CurrencySelectorProps = {
  currencyCode: string;
  isOpen?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function CurrencySelector({
  currencyCode,
  isOpen = false,
  disabled = false,
  onClick,
}: CurrencySelectorProps) {
  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={onClick}
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-label={`Selected currency: ${currencyCode}. Click to change.`}
    >
      <Flag currencyCode={currencyCode} size="row" />
      <span className={styles.code}>{currencyCode}</span>
      <ChevronDown
        className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
        aria-hidden
      />
    </button>
  );
}
