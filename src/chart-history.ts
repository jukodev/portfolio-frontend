import type { HistoryPoint } from './portfolio-types';

export function chartHistory(data: HistoryPoint[]) {
  const sorted = [...data].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const result: (HistoryPoint & { timestamp: number })[] = [];
  for (const point of sorted) {
    const timestamp = Date.parse(point.date);
    const previous = result.at(-1);
    // A line across years without observations would invent a performance history.
    if (previous && timestamp - previous.timestamp > 10 * 86400000) {
      const middle = (previous.timestamp + timestamp) / 2;
      result.push({ date: new Date(middle).toISOString(), timestamp: middle,
        value: null, investment: previous.investment ?? null, netValue: null, source: 'gap' });
    }
    result.push({ ...point, timestamp });
  }
  return result;
}
