import { createContext, useContext } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Depot, Dividend, Forecast, Health, HistoryPoint, Job, Portfolio, Source, Stock, Transaction } from './portfolio-types';
export type DialogState = { kind: 'depot' | 'stock' | 'transaction' | 'dividend' | 'source'; record?: Depot | Stock | Transaction | Dividend | Source };
export type PortfolioContextValue = {
  readOnly: boolean; owner: string; depotId: number | undefined; route: string; days: number; setDays: (n: number) => void;
  basis: string; taxPercent: number; saleFee: number; setTaxPercent: (n: number) => void; setSaleFee: (n: number) => void;
  health: UseQueryResult<Health, Error>; depots: UseQueryResult<Depot[], Error>; stocks: UseQueryResult<Stock[], Error>;
  portfolio: UseQueryResult<Portfolio, Error>; dividends: UseQueryResult<Dividend[], Error>; transactions: UseQueryResult<Transaction[], Error>;
  history: UseQueryResult<HistoryPoint[], Error>; forecast: UseQueryResult<Forecast[], Error>; sources: UseQueryResult<Source[], Error>; jobs: UseQueryResult<Job, Error>;
  open: (dialog: DialogState) => void; remove: (path: string, description: string) => Promise<void>;
  save: <T>(path: string, body: unknown, method?: string) => Promise<T>; busy: boolean;
};
export const PortfolioContext = createContext<PortfolioContextValue | null>(null);
export function usePortfolio() { const context = useContext(PortfolioContext); if (!context) throw new Error('Portfolio-Kontext fehlt.'); return context; }
