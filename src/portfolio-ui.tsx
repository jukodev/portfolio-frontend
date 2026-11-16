import { usePortfolio } from './portfolio-context';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { ArrowDown, ArrowUp, ChevronRight, X, ArrowUpRight, Search } from 'lucide-react';
import { date, eur, num } from './portfolio-api';
import { chartHistory } from './chart-history';
import type { HistoryPoint } from './portfolio-types';

export const colors = ['#2c6a57', '#718fc2', '#c2a56d', '#8777a9', '#8fa9a1', '#b77c6e', '#6b8490'];
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="empty"><span className="empty-symbol">↗</span><h3>{title}</h3>{children && <div>{children}</div>}{action}</div>;
}
export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  return <div className="error-box" role="alert"><strong>Das hat nicht geklappt.</strong><p>{error instanceof Error ? error.message : 'Bitte erneut versuchen.'}</p>{retry && <button onClick={retry} className="button secondary">Erneut versuchen</button>}</div>;
}
export function Loading() { return <div className="loading" role="status"><span className="spinner" />Daten werden geladen …</div>; }
export function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function Metric({ label, value, note, change, onClick, prominent }: { label: string; value: string; note?: string; change?: number | null; onClick?: () => void; prominent?: boolean }) {
  const content = <><span className="metric-label">{label}{onClick && <ArrowUpRight size={16} />}</span><strong className="metric-value">{value}</strong><span className="metric-note">{change != null && <span className={change < 0 ? 'negative' : 'positive'}>{change < 0 ? <ArrowDown size={13} /> : <ArrowUp size={13} />}{eur(Math.abs(change))} </span>}{note}</span></>;
  return onClick ? <button className={`metric ${prominent ? 'prominent' : ''}`} onClick={onClick}>{content}</button> : <div className={`metric ${prominent ? 'prominent' : ''}`}>{content}</div>;
}
export function Jump({ to, children }: { to: string; children: ReactNode }) { return <a className="jump" href={`#/${to}`}>{children}<ChevronRight size={16} /></a>; }
export function Range({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="segments" aria-label="Zeitraum">{[[1, '24h'], [7, '1W'], [30, '1M'], [90, '3M'], [365, '1J'], [36500, 'Alle']].map(([n, label]) => <button key={n} aria-pressed={value === n} className={value === n ? 'selected' : ''} onClick={() => onChange(Number(n))}>{label}</button>)}</div>;
}
export function ValueChart({ data, quote = false }: { data: HistoryPoint[]; quote?: boolean }) {
  const id = useId().replaceAll(':', '');
  const points = chartHistory(data);
  const sparse = data.filter(x => x.value != null).length <= 30;
  if (data.length === 0) return <Empty title="Der Verlauf beginnt hier">Sobald ein Kauf oder eine Bewertung vorliegt, siehst du hier die Entwicklung.</Empty>;
  return <><div className="chart" role="img" aria-label={`${quote ? 'Kursverlauf' : 'Depotentwicklung'} mit ${data.length} Messpunkten. Letzter Wert: ${eur(data.at(-1)?.value)}`}>
    <ResponsiveContainer width="100%" height="100%"><ComposedChart data={points} margin={{ top: 14, right: 12, bottom: 0, left: 0 }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3c8068" stopOpacity={0.19} /><stop offset="100%" stopColor="#3c8068" stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
      <XAxis dataKey="timestamp" type="number" scale="time" domain={['dataMin', 'dataMax']} interval="preserveStartEnd" tickFormatter={v => new Date(Number(v)).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', ...(data.length > 1 && Date.parse(data.at(-1)!.date) - Date.parse(data[0].date) > 365 * 86400000 ? { year: '2-digit' } : {}) })} minTickGap={45} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-text)', fontSize: 12 }} />
      <YAxis width={70} domain={quote ? ['auto', 'auto'] : [(min: number) => Math.min(0, min), 'auto']} tickFormatter={v => Math.abs(Number(v)) >= 1000 ? `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: quote ? 3 : 1 }).format(Number(v) / 1000)} Tsd.` : num(Number(v))} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-text)', fontSize: 12 }} />
      <Tooltip labelFormatter={(v, payload) => `${date(new Date(Number(v)).toISOString())}${({ purchase: quote ? ' · Kaufpreis' : ' · Erster Kauf', transaction: ' · Buchungstag', reconstructed: ' · Aus historischen Kursen', historical: ' · Historischer Schlusskurs', current: ' · Aktuelle Bewertung' } as Record<string, string>)[payload?.[0]?.payload?.source] ?? ''}${payload?.[0]?.payload?.transactions ? ` · ${payload[0].payload.transactions} Buchung(en)` : ''}`} formatter={(v, name) => [eur(Number(v)), name]} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--text)' }} />
      <Area dataKey="value" name={quote ? 'Kurs' : 'Depotwert'} type="linear" stroke="#34775f" strokeWidth={2.5} dot={({ cx, cy, payload }) => payload.value != null && (sparse || payload.transactions > 0 || payload.source === 'purchase') ? <circle key={payload.timestamp} cx={cx} cy={cy} r={3} fill="#34775f" stroke="var(--surface)" strokeWidth={1} /> : <g key={payload.timestamp} />} fill={`url(#${id})`} isAnimationActive={false} connectNulls={false} />
      {!quote && <Line dataKey="investment" name="Einstand" type="stepAfter" stroke="#a6a8aa" strokeWidth={1.5} connectNulls={false} dot={({ cx, cy, payload }) => payload.transactions > 0 || sparse ? <circle key={payload.timestamp} cx={cx} cy={cy} r={payload.transactions > 0 ? 3.5 : 2.5} fill="#a6a8aa" stroke="var(--surface)" strokeWidth={1.5} /> : <g key={payload.timestamp} />} strokeDasharray="5 5" isAnimationActive={false} />}
      {!quote && <Line dataKey="netValue" name="Nettowert (geschätzt)" stroke="#718fc2" strokeWidth={1.5} connectNulls={false} dot={sparse ? { r: 2.5 } : false} isAnimationActive={false} />}
    </ComposedChart></ResponsiveContainer>
    <div className="chart-legend"><span><i style={{ background: '#34775f' }} />{quote ? 'Kurs in EUR' : 'Depotwert'}</span>{!quote && <><span><i style={{ background: '#a6a8aa' }} />Einstand</span><span><i style={{ background: '#718fc2' }} />Netto, geschätzt</span></>}</div>
  </div>{points.some(x => x.source === 'gap') && <p className="fine-print">Kurslücken von mehr als zehn Tagen unterbrechen die Wertlinien.{!quote && ' Der Einstand bleibt aus deinen Buchungen bekannt.'}</p>}{!quote && data.some(x => x.value == null) && <p className="fine-print">Für einige Zeitpunkte fehlen noch historische Kurse. Der Einstand zeigt bereits sämtliche Buchungen; unvollständige Depotwerte bleiben leer.</p>}{data.filter(x => x.value != null).length === 1 && <p className="fine-print">Nur eine Bewertung verfügbar – daraus lässt sich noch keine Entwicklung ablesen.</p>}</>;
}
export function DividendChart({ data }: { data: { month: string; gross: number; net: number }[] }) {
  return <div className="bar-chart" role="img" aria-label={`Dividenden nach Monat, netto insgesamt ${eur(data.reduce((sum, x) => sum + x.net, 0))}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ left: -10, top: 10, right: 0 }}><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-text)', fontSize: 12 }} /><YAxis tickFormatter={v => num(Number(v))} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-text)', fontSize: 12 }} /><Tooltip formatter={(v, name) => [eur(Number(v)), name]} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--text)' }} /><Bar name="Brutto" dataKey="gross" fill="#c6d8cf" radius={[4, 4, 0, 0]} /><Bar name="Netto" dataKey="net" fill="#34775f" radius={[4, 4, 0, 0]} /><Legend /></BarChart></ResponsiveContainer></div>;
}
export function Allocation({ data }: { data: { name: string; value: number; to: string }[] }) {
  const total = data.reduce((sum, x) => sum + x.value, 0);
  if (!total) return <Empty title="Noch keine Allokation">Sobald Bestände und Kurse vorliegen, erscheint hier die Verteilung.</Empty>;
  return <><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="90%" paddingAngle={3} stroke="none" isAnimationActive={false}>{data.map((x, i) => <Cell key={x.name} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={v => eur(Number(v))} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{data.length}</strong><span>Positionen</span></div></div><div className="allocation-list">{data.map((x, i) => <a href={`#/${x.to}`} key={x.name}><span className="allocation-name"><i style={{ background: colors[i % colors.length] }} />{x.name}</span><strong>{num(x.value / total * 100)} %</strong></a>)}</div></>;
}
export type Column<T> = { label: string; value: (row: T) => string | number | null; render?: (row: T) => ReactNode; numeric?: boolean };
export function Grid<T>({ rows, columns, rowKey, empty = 'Keine Einträge vorhanden.' }: { rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string | number; empty?: string }) {
  const { readOnly } = usePortfolio();
  columns = columns.filter(c => !readOnly || c.label !== 'Aktionen');
  const [sort, setSort] = useState<{ index: number; descending: boolean } | null>(null);
  const sorted = [...rows];
  if (sort) sorted.sort((a, b) => { const va = columns[sort.index].value(a), vb = columns[sort.index].value(b); const diff = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'de'); return sort.descending ? -diff : diff; });
  return <div className="table-scroll"><table><thead><tr>{columns.map((c, i) => <th key={c.label} className={c.numeric ? 'align-right' : ''} aria-sort={sort?.index === i ? sort.descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => setSort({ index: i, descending: sort?.index === i ? !sort.descending : false })}>{c.label}{sort?.index === i && (sort.descending ? ' ↓' : ' ↑')}</button></th>)}</tr></thead><tbody>{sorted.map(row => <tr key={rowKey(row)}>{columns.map(c => <td key={c.label} data-label={c.label} className={c.numeric ? 'align-right' : ''}>{c.render ? c.render(row) : c.value(row)}</td>)}</tr>)}</tbody></table>{!rows.length && <Empty title={empty} />}</div>;
}
export function SearchBox({ value, onChange, placeholder = 'Wertpapier suchen …' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search"><Search size={17} /><input aria-label={placeholder} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></label>;
}
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={id} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}><div className="modal-heading"><h2 id={id}>{title}</h2><button onClick={onClose} className="icon-button" aria-label="Schließen"><X size={20} /></button></div>{children}</dialog>;
}
