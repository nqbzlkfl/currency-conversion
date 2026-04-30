import { formatRate } from '@/helpers/format';
import styles from './RateDisplay.module.css';

type RateDisplayProps = {
  fromCurrency: string;
  toCurrency: string;
  rate: number | null;
};

const RATE_UNAVAILABLE_LABEL = 'Rate unavailable';

export function RateDisplay({ fromCurrency, toCurrency, rate }: RateDisplayProps) {
  const valueText =
    rate !== null && Number.isFinite(rate)
      ? `1 ${fromCurrency} = ${formatRate(rate)} ${toCurrency}`
      : RATE_UNAVAILABLE_LABEL;

  return (
    <section className={styles.section} aria-live="polite">
      <div className={styles.label}>Indicative Exchange Rate</div>
      <div className={styles.value}>{valueText}</div>
    </section>
  );
}
