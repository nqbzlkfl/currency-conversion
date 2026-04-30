import { useReducer } from 'react';
import {
  DEFAULT_AMOUNT,
  DEFAULT_FROM_CURRENCY,
  DEFAULT_TO_CURRENCY,
} from '@/helpers/constants';
import { formatAmount } from '@/helpers/format';

export type ConverterState = {
  from: string;
  to: string;
  amount: number;
  amountInput: string;
  lastChangeWasCurrency: boolean;
  /** Increments on every action so effects can re-fire after SWAP (where
   * from/to exchange but the dependency *set* is unchanged). */
  epoch: number;
};

export type ConverterAction =
  | { type: 'SET_FROM'; code: string }
  | { type: 'SET_TO'; code: string }
  | { type: 'SET_AMOUNT'; display: string; numeric: number }
  | { type: 'SWAP' };

const initialState: ConverterState = {
  from: DEFAULT_FROM_CURRENCY,
  to: DEFAULT_TO_CURRENCY,
  amount: DEFAULT_AMOUNT,
  amountInput: formatAmount(DEFAULT_AMOUNT),
  lastChangeWasCurrency: false,
  epoch: 0,
};

function reducer(state: ConverterState, action: ConverterAction): ConverterState {
  const epoch = state.epoch + 1;
  switch (action.type) {
    case 'SET_FROM':
      return { ...state, from: action.code, lastChangeWasCurrency: true, epoch };
    case 'SET_TO':
      return { ...state, to: action.code, lastChangeWasCurrency: true, epoch };
    case 'SET_AMOUNT':
      return {
        ...state,
        amount: action.numeric,
        amountInput: action.display,
        lastChangeWasCurrency: false,
        epoch,
      };
    case 'SWAP':
      return {
        ...state,
        from: state.to,
        to: state.from,
        lastChangeWasCurrency: true,
        epoch,
      };
    default:
      return state;
  }
}

export function useConverterState() {
  return useReducer(reducer, initialState);
}
