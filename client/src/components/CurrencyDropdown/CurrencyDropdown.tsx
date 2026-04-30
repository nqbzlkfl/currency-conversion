import { useEffect } from 'react';
import { Flag } from '@/components/Flag';
import type { Currency } from '@/types/api';
import styles from './CurrencyDropdown.module.css';

type CurrencyDropdownProps = {
  currencies: Currency[];
  selectedCode: string;
  onSelect: (code: string) => void;
  onDismiss: () => void;
};

const ESCAPE_KEY = 'Escape';

export function CurrencyDropdown({
  currencies,
  selectedCode,
  onSelect,
  onDismiss,
}: CurrencyDropdownProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ESCAPE_KEY) onDismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onDismiss]);

  return (
    <>
      <div className={styles.overlay} onClick={onDismiss} aria-hidden />
      <div className={styles.panel} role="listbox" aria-label="Currencies">
        <ul className={styles.list}>
          {currencies.map((currency) => {
            const isSelected = currency.code === selectedCode;
            return (
              <li key={currency.code}>
                <button
                  type="button"
                  className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(currency.code);
                  }}
                >
                  <Flag currencyCode={currency.code} size="dropdown" />
                  <span className={styles.code}>{currency.code}</span>
                  <span className={styles.name}>{currency.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
