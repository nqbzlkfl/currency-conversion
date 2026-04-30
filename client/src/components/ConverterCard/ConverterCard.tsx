import { ReactNode } from 'react';
import { CurrencyRow } from '@/components/CurrencyRow';
import { SwapButton } from '@/components/SwapButton';
import styles from './ConverterCard.module.css';

type ConverterCardProps = {
  fromCurrency: string;
  toCurrency: string;
  amountDisplay: string;
  resultDisplay: string;
  isSwapping?: boolean;
  isInitialLoad?: boolean;
  isFromDropdownOpen?: boolean;
  isToDropdownOpen?: boolean;
  onAmountChange?: (display: string, numeric: number) => void;
  onSwapClick?: () => void;
  onFromSelectorClick?: () => void;
  onToSelectorClick?: () => void;
  fromDropdownSlot?: ReactNode;
  toDropdownSlot?: ReactNode;
};

const FROM_LABEL = 'Amount';
const TO_LABEL = 'Converted Amount';

export function ConverterCard({
  fromCurrency,
  toCurrency,
  amountDisplay,
  resultDisplay,
  isSwapping = false,
  isInitialLoad = false,
  isFromDropdownOpen = false,
  isToDropdownOpen = false,
  onAmountChange,
  onSwapClick,
  onFromSelectorClick,
  onToSelectorClick,
  fromDropdownSlot,
  toDropdownSlot,
}: ConverterCardProps) {
  const cardClass = `${styles.card} ${isInitialLoad ? styles.cardLoading : ''}`;
  return (
    <section className={cardClass} aria-label="Currency conversion" aria-busy={isInitialLoad}>
      <CurrencyRow
        label={FROM_LABEL}
        currencyCode={fromCurrency}
        amountDisplay={amountDisplay}
        isDropdownOpen={isFromDropdownOpen}
        isFading={isSwapping}
        onSelectorClick={onFromSelectorClick}
        onAmountChange={onAmountChange}
        dropdownSlot={fromDropdownSlot}
      />

      <SwapButton onClick={onSwapClick} isSpinning={isSwapping} />

      <CurrencyRow
        label={TO_LABEL}
        currencyCode={toCurrency}
        amountDisplay={resultDisplay}
        isDropdownOpen={isToDropdownOpen}
        isAmountReadOnly
        isFading={isSwapping}
        onSelectorClick={onToSelectorClick}
        dropdownSlot={toDropdownSlot}
      />
    </section>
  );
}
