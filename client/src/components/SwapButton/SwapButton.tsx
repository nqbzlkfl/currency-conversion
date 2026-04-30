import { SwapIcon } from './SwapIcon';
import styles from './SwapButton.module.css';

type SwapButtonProps = {
  onClick?: () => void;
  isSpinning?: boolean;
  disabled?: boolean;
};

export function SwapButton({ onClick, isSpinning = false, disabled = false }: SwapButtonProps) {
  return (
    <div className={styles.dividerArea}>
      <div className={styles.divider} />
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        disabled={disabled}
        aria-label="Swap from and to currencies"
      >
        <span className={`${styles.iconWrap} ${isSpinning ? styles.spin : ''}`}>
          <SwapIcon />
        </span>
      </button>
    </div>
  );
}
