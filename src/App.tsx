import { PortfolioSelect } from './portfolio-select';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, ChartNoAxesCombined, LayoutDashboard, Wallet, ArrowLeftRight, Coins, Settings2, Plus, RefreshCw, Moon, Sun, ChevronDown, X } from 'lucide-react';
import { PortfolioContext, type DialogState } from './portfolio-context';
import { request, params, date, go } from './portfolio-api';
import type { Depot, Dividend, Forecast, Health, HistoryPoint, Job, Portfolio, Source, Stock, Transaction } from './portfolio-types';
import { Dashboard, Positions, Transactions, Dividends, History, Settings, PositionDetail } from './portfolio-pages';
import { EditForm } from './portfolio-forms';
import { Empty, ErrorBox, Loading } from './portfolio-ui';

const navigation = [
  { route: 'dashboard', label: 'Übersicht', icon: LayoutDashboard }, { route: 'positions', label: 'Positionen', icon: Wallet },
  { route: 'transactions', label: 'Transaktionen', icon: ArrowLeftRight }, { route: 'dividends', label: 'Dividenden', icon: Coins },
  { route: 'history', label: 'Entwicklung', icon: ChartNoAxesCombined }, { route: 'settings', label: 'Verwaltung', icon: Settings2 },
];
const getRoute = () => window.location.hash.replace(/^#\/?/, '') || 'dashboard';
function storedNumber(key: string, fallback: number, max: number) { const raw = localStorage.getItem(key); const n = raw === null ? fallback : Number(raw); return Number.isFinite(n) && n >= 0 && n <= max ? n : fallback; }

export default function App() {
  const queryClient = useQueryClient();
  const [readOnly, setReadOnly] = useState(() => matchMedia('(display-mode: standalone)').matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const media = matchMedia('(display-mode: standalone)');
    const change = () => setReadOnly(media.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    const network = () => setOnline(navigator.onLine);
    media.addEventListener('change', change); window.addEventListener('online', network); window.addEventListener('offline', network);
    return () => { media.removeEventListener('change', change); window.removeEventListener('online', network); window.removeEventListener('offline', network); };
  }, []);
  useEffect(() => { if (readOnly) setDialog(null); }, [readOnly]);
  const [route, setRoute] = useState(getRoute);
  const [preferredOwner, setPreferredOwner] = useState(() => localStorage.getItem('portfolio.owner') || '');
  const [depotId, setDepotId] = useState<number>();
  const [basis, setBasis] = useState('last'); const [days, setDays] = useState(365);
  const [taxPercent, updateTax] = useState(() => storedNumber('portfolio.tax', 26.375, 100));
  const [saleFee, updateFee] = useState(() => storedNumber('portfolio.fee', 7, 100000));
  const [theme, setTheme] = useState(() => localStorage.getItem('portfolio.theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(null);
  useEffect(() => { const listener = () => { setRoute(getRoute()); window.scrollTo({ top: 0 }); }; window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('portfolio.theme', theme); }, [theme]);
  useEffect(() => { if (!notice || notice.error) return; const timer = window.setTimeout(() => setNotice(null), 5000); return () => clearTimeout(timer); }, [notice]);
  const health = useQuery({ queryKey: ['health'], queryFn: () => request<Health>('health'), retry: 1 });
  const ready = !!health.data?.databaseConfigured;
  const users = useQuery({ queryKey: ['users'], queryFn: () => request<{ name: string }[]>('users'), enabled: ready, retry: 1 });
  const owner = users.data?.some(x => x.name === preferredOwner) ? preferredOwner : users.data?.[0]?.name || '';
  const financial = ready && !!owner;
  const filter = params({ owner, depotId });
  const depots = useQuery({ queryKey: ['depots', owner], queryFn: () => request<Depot[]>(`depots?${params({ owner })}`), enabled: financial });
  const stocks = useQuery({ queryKey: ['stocks'], queryFn: () => request<Stock[]>('stocks'), enabled: ready });
  const portfolio = useQuery({ queryKey: ['portfolio', owner, depotId, basis, taxPercent, saleFee], queryFn: () => request<Portfolio>(`portfolio?${params({ owner, depotId, basis, taxPercent, saleFee })}`), enabled: financial });
  const dividends = useQuery({ queryKey: ['dividends', owner, depotId], queryFn: () => request<Dividend[]>(`dividends?${filter}`), enabled: financial });
  const transactions = useQuery({ queryKey: ['transactions', owner, depotId], queryFn: () => request<Transaction[]>(`transactions?${filter}`), enabled: financial });
  const historyBasis = basis === 'bid' ? 'bid' : 'last';
  const history = useQuery({ queryKey: ['history', owner, depotId, days, historyBasis, taxPercent, saleFee], queryFn: () => request<HistoryPoint[]>(`history?${params({ owner, depotId, days, basis: historyBasis, taxPercent, saleFee })}`), enabled: financial, refetchInterval: 30000 });
  const forecast = useQuery({ queryKey: ['forecast', owner, depotId], queryFn: () => request<Forecast[]>(`forecast?${filter}`), enabled: financial });
  const sources = useQuery({ queryKey: ['sources'], queryFn: () => request<Source[]>('sources'), enabled: ready });
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => request<Job>('jobs'), enabled: ready, refetchInterval: 10000 });
  const mutation = useMutation({ mutationFn: ({ path, body, method }: { path: string; body?: unknown; method: string }) => request<unknown>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }), onSuccess: async () => { await queryClient.invalidateQueries(); } });
  async function save<T>(path: string, body: unknown, method = 'POST'): Promise<T> {
    if (readOnly) throw new Error('Bitte Änderungen in der Browser-Version vornehmen.');
    const result = await mutation.mutateAsync({ path, body, method });
    const fetch = (result as { initialFetch?: { success: boolean; message: string } } | null)?.initialFetch;
    setNotice({ message: fetch ? `Änderungen gespeichert. ${fetch.message}` : 'Änderungen gespeichert.', error: fetch ? !fetch.success : false });
    return result as T;
  }
  async function remove(path: string, description: string) {
    if (readOnly) return;
    if (!window.confirm(`${description} wirklich löschen?`)) return;
    try { await mutation.mutateAsync({ path, method: 'DELETE' }); setNotice({ message: 'Eintrag gelöscht.' }); } catch (error) { setNotice({ message: (error as Error).message, error: true }); }
  }
  const refresh = useMutation({ mutationFn: () => request<Job>(`refresh?${filter}`, { method: 'POST' }), onSuccess: async result => { await queryClient.invalidateQueries(); const failures = result.results.filter(x => !x.success).length; setNotice({ message: result.error || (failures ? `${failures} Kursquellen konnten nicht aktualisiert werden. Details unter Verwaltung.` : 'Kurse und Bewertungen aktualisiert.'), error: !!result.error || failures > 0 }); }, onError: error => setNotice({ message: error.message, error: true }) });
  const section = readOnly && route.split('/')[0] === 'settings' ? 'dashboard' : route.split('/')[0]; const title = route.startsWith('position/') ? 'Positionsdetails' : navigation.find(x => x.route === section)?.label || 'Übersicht';
  const setTaxPercent = (n: number) => { updateTax(n); localStorage.setItem('portfolio.tax', String(n)); };
  const setSaleFee = (n: number) => { updateFee(n); localStorage.setItem('portfolio.fee', String(n)); };
  let content;
  if (health.isPending || (ready && users.isPending)) content = <Loading />;
  else if (health.isError) content = <ErrorBox error={health.error} retry={() => void health.refetch()} />;
  else if (!ready) content = <Empty title="Verbinde dein Portfolio"><p>Das Backend läuft. Hinterlege jetzt die Verbindung zu deiner bestehenden Datenbank.</p><code>ConnectionStrings__Portfolio</code><p>Zum Ausprobieren ohne echte Daten: Backend mit <code>--Demo=true</code> starten.</p></Empty>;
  else if (users.isError) content = <ErrorBox error={users.error} retry={() => void users.refetch()} />;
  else if (!owner && section !== 'settings') content = <Empty title="Dein Portfolio beginnt mit einem Depot" action={!readOnly && <button className="button primary" onClick={() => setDialog({ kind: 'depot' })}><Plus size={17} />Erstes Depot anlegen</button>}>Lege einen Besitzer und sein erstes Depot an. Weitere Personen kannst du später jederzeit hinzufügen.</Empty>;
  else if (section === 'positions') content = <Positions />;
  else if (section === 'transactions') content = <Transactions />;
  else if (section === 'dividends') content = <Dividends />;
  else if (section === 'history') content = <History />;
  else if (section === 'settings') content = <Settings />;
  else if (section === 'position') content = <PositionDetail key={`${route}-${owner}-${taxPercent}-${saleFee}`} />;
  else content = <Dashboard />;
  return <PortfolioContext.Provider value={{ readOnly, owner, depotId, route, days, setDays, basis, taxPercent, saleFee, setTaxPercent, setSaleFee, health, depots, stocks, portfolio, dividends, transactions, history, forecast, sources, jobs, open: value => { if (!readOnly) setDialog(value); }, remove, save, busy: mutation.isPending }}>
    <a className="skip-link" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Zum Inhalt springen</a>
    <div className={`app-shell ${readOnly ? 'pwa-mode' : 'browser-mode'}`}><aside className="sidebar"><a className="brand" href="#/dashboard"><span className="brand-symbol"><ArrowUpRight size={24} /></span><span>Portfolio<span className="brand-subtitle">Dein Vermögen. Im Blick.</span></span></a>
      <div className="sidebar-section-label">DEIN PORTFOLIO</div><nav aria-label="Hauptnavigation">{navigation.filter(item => !readOnly || item.route !== 'settings').map(item => <a key={item.route} href={`#/${item.route}`} className={section === item.route || (section === 'position' && item.route === 'positions') ? 'active' : ''} aria-current={section === item.route ? 'page' : undefined}><item.icon size={19} />{item.label}{item.route === 'positions' && !!portfolio.data?.summary.positionCount && <span className="nav-count">{portfolio.data.summary.positionCount}</span>}</a>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="status-dot" />{health.data?.demo ? 'Demomodus' : 'Deine Datenbank'}<span>Alles an einem Ort.</span></div><label className="user-picker"><span className="avatar">{owner.slice(0, 2).toUpperCase() || '–'}</span><span><span className="small-label">Ansicht für</span><PortfolioSelect aria-label="Besitzer wechseln" value={owner} onChange={e => { setPreferredOwner(e.target.value); localStorage.setItem('portfolio.owner', e.target.value); setDepotId(undefined); setDialog(null); go('dashboard'); }}>{!owner && <option value="">Besitzer wählen</option>}{users.data?.map(user => <option key={user.name}>{user.name}</option>)}</PortfolioSelect></span><ChevronDown size={15} /></label></div>
    </aside><div className="workspace"><header className="topbar"><div className="breadcrumb">Mein Portfolio<span>/</span><strong>{title}</strong></div><div className="topbar-actions"><span className="today">{date(new Date().toISOString())}</span><button className="icon-button" aria-label={theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button></div></header>
      {health.data?.demo && <div className="demo-banner">Demodaten · Beispielkurse und Buchungen, keine echten Vermögenswerte</div>}
      <main id="main" tabIndex={-1}><div className="page-heading"><div><span className="eyebrow">{section === 'dashboard' ? 'DAS GROSSE GANZE' : 'DEIN PORTFOLIO'}</span><h1>{section === 'dashboard' ? 'Alles im Blick.' : title}</h1><p>{section === 'dashboard' ? `Dein Vermögen, deine Entwicklung und was als Nächstes ansteht.${owner ? ` Für ${owner}.` : ''}` : section === 'positions' ? 'Von der Gesamtübersicht bis zum einzelnen Kauf.' : section === 'dividends' ? 'Was dein Portfolio für dich erwirtschaftet.' : section === 'history' ? 'Deine Entwicklung über die Zeit.' : section === 'settings' ? 'Depots, Wertpapiere und Kursquellen verwalten.' : section === 'transactions' ? 'Jede Bewegung. Nachvollziehbar an einem Ort.' : 'Bestand, Erträge und deine nächsten Möglichkeiten.'}</p></div><div className="page-actions desktop-actions">{!readOnly && section !== 'settings' && <button className="button secondary" disabled={!owner || refresh.isPending || jobs.data?.running || health.data?.demo} onClick={() => refresh.mutate()}><RefreshCw size={16} className={refresh.isPending || jobs.data?.running ? 'spin' : ''} />{refresh.isPending || jobs.data?.running ? 'Aktualisiert …' : 'Kurse aktualisieren'}</button>}{!readOnly && <button className="button primary" disabled={!ready} onClick={() => setDialog({ kind: section === 'settings' || !owner ? 'depot' : section === 'dividends' ? 'dividend' : 'transaction' })}><Plus size={17} />{section === 'settings' || !owner ? 'Depot anlegen' : section === 'dividends' ? 'Dividende erfassen' : 'Transaktion erfassen'}</button>}</div></div>
        {owner && section !== 'settings' && <div className="filterbar"><div className="filter-group"><PortfolioSelect label="Depot" value={depotId || ''} onChange={e => { setDepotId(e.target.value ? Number(e.target.value) : undefined); if (section === 'position') go('positions'); }}><option value="">Alle Depots</option>{depots.data?.map(depot => <option key={depot.id} value={depot.id}>{depot.bezeichnung}</option>)}</PortfolioSelect><PortfolioSelect label="Bewertung" value={basis} onChange={e => setBasis(e.target.value)}><option value="last">Letzter Kurs</option><option value="bid">Geldkurs</option><option value="ask">Briefkurs</option><option value="previous">Vortag</option><option value="open">Eröffnung</option><option value="high">Tageshoch</option><option value="low">Tagestief</option><option value="yearHigh">Jahreshoch</option><option value="yearLow">Jahrestief</option></PortfolioSelect></div><span className="last-update"><span className={`status-dot ${portfolio.data?.summary.missingQuotes ? 'warning' : ''}`} />Kursstand {date(portfolio.data?.summary.lastUpdated, true)}</span></div>}
        {notice && <div className={`notice ${notice.error ? 'notice-error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.message}<button className="icon-button" aria-label="Hinweis schließen" onClick={() => setNotice(null)}><X size={16} /></button></div>}
        {!online && <div className="notice" role="status">Du bist offline. Angezeigte Werte können veraltet sein. Für aktuelle Statistiken bitte wieder verbinden.</div>}
        {content}
        <footer className="page-footer"><span>Portfolio <span className="footer-dot">·</span> Klarheit für dein Vermögen</span><span>EUR · Nettowerte sind Schätzungen</span></footer>
      </main></div><nav className="mobile-nav" aria-label="Mobile Hauptnavigation">{navigation.filter(item => item.route !== 'settings').map(item => <a key={item.route} href={`#/${item.route}`} aria-current={section === item.route || (section === 'position' && item.route === 'positions') ? 'page' : undefined}><item.icon size={21} /><span>{item.route === 'transactions' ? 'Buchungen' : item.label}</span></a>)}</nav></div>{dialog && !readOnly && <EditForm dialog={dialog} onClose={() => setDialog(null)} />}
  </PortfolioContext.Provider>;
}
