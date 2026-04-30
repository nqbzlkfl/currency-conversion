export type OxrLatestResponse = {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
};

export type OxrCurrenciesResponse = Record<string, string>;

export type OxrErrorResponse = {
  error: true;
  status: number;
  message: string;
  description: string;
};
