export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({ title: 'Der Server ist nicht erreichbar.' })) as { title?: string; errors?: Record<string, string[]> };
    throw new Error(problem.errors ? Object.values(problem.errors).flat().join(' ') : problem.title || `Anfrage fehlgeschlagen (${response.status}).`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
export function params(values: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  return search.toString();
}
const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 4 });
export const eur = (value: number | null | undefined) => value == null ? '–' : money.format(value);
export const num = (value: number | null | undefined) => value == null ? '–' : number.format(value);
export const pct = (value: number | null | undefined) => value == null ? '–' : `${value > 0 ? '+' : ''}${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} %`;
export const date = (value: string | null | undefined, time = false) => value ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: time ? undefined : 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(value)) : 'Noch kein Abruf';
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
export const go = (route: string) => { window.location.hash = `/${route}`; };
export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => { const raw = String(v ?? ''); return `"${(/^[=+\-@]/.test(raw) && typeof v !== 'number' ? "'" : '') + raw.replaceAll('"', '""')}"`; };
  const blob = new Blob(['\uFEFF', [keys.join(';'), ...rows.map(row => keys.map(key => escape(row[key])).join(';'))].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
