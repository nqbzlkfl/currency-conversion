/**
 * Animation timing constants. Keep values in sync with the CSS custom
 * properties in src/styles/theme.css (--anim-fade-duration, --anim-spin-duration).
 * Duplicated in TS because the swap animation is orchestrated via setTimeout.
 */

export const FADE_DURATION_MS = 300;
export const SPIN_DURATION_MS = 900;
export const SWAP_TOTAL_MS = FADE_DURATION_MS * 2;
export const CHEVRON_ROTATE_MS = 200;
