import { useCallback, useState } from 'react';
import { ConverterCard } from '@/components/ConverterCard';
import { CurrencyDropdown } from '@/components/CurrencyDropdown';
import { RateDisplay } from '@/components/RateDisplay';
import {
  useConvert,
  useConverterState,
  useCurrencies,
  useSwapAnimation,
} from '@/hooks';
import { formatAmount } from '@/helpers/format';
import styles from './App.module.css';

const PAGE_TITLE = 'Currency Converter';
const PAGE_SUBTITLE =
  'Check live rates, set rate alerts, receive notifications and more.';
const CURRENCIES_ERROR_FALLBACK = 'Unable to load currencies. Please refresh.';
const EMPTY_RESULT_DISPLAY = '';

type OpenDropdown = 'from' | 'to' | null;

export function App() {
  const [state, dispatch] = useConverterState();
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);

  const currenciesQuery = useCurrencies();

  const convertQuery = useConvert(state.from, state.to, state.amount, {
    immediate: state.lastChangeWasCurrency,
    epoch: state.epoch,
  });

  const handleMidpoint = useCallback(() => {
    dispatch({ type: 'SWAP' });
  }, [dispatch]);

  const { isSwapping, triggerSwap } = useSwapAnimation({
    onMidpoint: handleMidpoint,
  });

  const handleAmountChange = (display: string, numeric: number) => {
    dispatch({ type: 'SET_AMOUNT', display, numeric });
  };

  const toggleDropdown = (which: 'from' | 'to') => {
    setOpenDropdown((current) => (current === which ? null : which));
  };

  const dismissDropdown = () => setOpenDropdown(null);

  const handleSelectFrom = (code: string) => {
    dispatch({ type: 'SET_FROM', code });
    dismissDropdown();
  };

  const handleSelectTo = (code: string) => {
    dispatch({ type: 'SET_TO', code });
    dismissDropdown();
  };

  const isCurrenciesReady = currenciesQuery.status === 'success';
  const showCurrenciesError = currenciesQuery.status === 'error';

  const resultDisplay =
    convertQuery.result !== null ? formatAmount(convertQuery.result) : EMPTY_RESULT_DISPLAY;

  const fromDropdown =
    isCurrenciesReady && openDropdown === 'from' ? (
      <CurrencyDropdown
        currencies={currenciesQuery.currencies}
        selectedCode={state.from}
        onSelect={handleSelectFrom}
        onDismiss={dismissDropdown}
      />
    ) : null;

  const toDropdown =
    isCurrenciesReady && openDropdown === 'to' ? (
      <CurrencyDropdown
        currencies={currenciesQuery.currencies}
        selectedCode={state.to}
        onSelect={handleSelectTo}
        onDismiss={dismissDropdown}
      />
    ) : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{PAGE_TITLE}</h1>
        <p className={styles.subtitle}>
          {showCurrenciesError ? CURRENCIES_ERROR_FALLBACK : PAGE_SUBTITLE}
        </p>
      </header>

      <ConverterCard
        fromCurrency={state.from}
        toCurrency={state.to}
        amountDisplay={state.amountInput}
        resultDisplay={resultDisplay}
        isSwapping={isSwapping}
        isFromDropdownOpen={openDropdown === 'from'}
        isToDropdownOpen={openDropdown === 'to'}
        onAmountChange={handleAmountChange}
        onSwapClick={triggerSwap}
        onFromSelectorClick={() => toggleDropdown('from')}
        onToSelectorClick={() => toggleDropdown('to')}
        fromDropdownSlot={fromDropdown}
        toDropdownSlot={toDropdown}
      />

      <RateDisplay
        fromCurrency={state.from}
        toCurrency={state.to}
        rate={convertQuery.rate}
      />
    </main>
  );
}
