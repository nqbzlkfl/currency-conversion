import ReactCountryFlag from 'react-country-flag';
import { getCountryCode } from '@/helpers/currencyToCountry';
import styles from './Flag.module.css';

export type FlagSize = 'row' | 'dropdown';

type FlagProps = {
  currencyCode: string;
  size?: FlagSize;
};

const SIZE_CLASS: Record<FlagSize, string> = {
  row: styles.row,
  dropdown: styles.dropdown,
};

export function Flag({ currencyCode, size = 'row' }: FlagProps) {
  const countryCode = getCountryCode(currencyCode);

  return (
    <span
      className={`${styles.flag} ${SIZE_CLASS[size]}`}
      aria-label={`${currencyCode} flag`}
    >
      <ReactCountryFlag countryCode={countryCode} svg />
    </span>
  );
}
