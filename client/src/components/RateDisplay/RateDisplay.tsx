import { formatRate } from '@/helpers/format';
import styles from './RateDisplay.module.css';

type RateDisplayProps = {
  fromCurrency: string;
  toCurrency: string;
  rate: number | null;
  isInitialLoad?: boolean;
};

const RATE_UNAVAILABLE_LABEL = 'Rate unavailable';
const RATE_LOADING_LABEL = 'Loading exchange rate';

export function RateDisplay({
  fromCurrency,
  toCurrency,
  rate,
  isInitialLoad = false,
}: RateDisplayProps) {
  const hasRate = rate !== null && Number.isFinite(rate);

  // Initial-load wins over "unavailable" so users see a loading affordance
  // instead of a scary error message during the first cold-start fetch.
  const showLoading = isInitialLoad && !hasRate;

  const valueText = hasRate
    ? `1 ${fromCurrency} = ${formatRate(rate as number)} ${toCurrency}`
    : showLoading
      ? RATE_LOADING_LABEL
      : RATE_UNAVAILABLE_LABEL;

  const valueClass = `${styles.value} ${showLoading ? styles.valueLoading : ''}`;

  return (
    <section className={styles.section} aria-live="polite" aria-busy={showLoading}>
      <div className={styles.label}>Indicative Exchange Rate</div>
      <div className={valueClass}>{valueText}</div>
    </section>
  );
}
