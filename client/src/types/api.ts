export type Currency = {
  code: string;
  name: string;
};

export type CurrenciesResponse = {
  currencies: Currency[];
};

export type ConvertResponse = {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
};

export type RatesResponse = {
  base: string;
  timestamp: number;
  rates: Record<string, number>;
};

export type ApiErrorResponse = {
  error: true;
  code: string;
  message: string;
};

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
