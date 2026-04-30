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

export type HealthResponse = {
  status: 'ok';
  uptime: number;
};

export type ApiErrorResponse = {
  error: true;
  code: string;
  message: string;
};
