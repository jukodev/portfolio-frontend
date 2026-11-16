import { useEffect, useRef, useState } from 'react';
import { request } from './portfolio-api';

type Suggestion = { name: string; isin: string };
export type SecurityDetails = Suggestion & { wkn: string; symbol: string; type: string; url: string; market: string; dividendUrl: string };

export function SecurityLookup({ onSelect, onBusy }: { onSelect: (value: SecurityDetails) => boolean; onBusy: (busy: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const detailRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { detailRequest.current?.abort(); onBusy(false); }, [onBusy]);
  useEffect(() => {
    const controller = new AbortController();
    if (query.trim().length < 2) return () => controller.abort();
    const timer = window.setTimeout(async () => {
      setStatus('Suche auf boerse.de …');
      try {
        const hits = await request<Suggestion[]>(`security-search?query=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setResults(hits); setStatus(hits.length ? `${hits.length} Vorschläge. Zum Übernehmen auswählen.` : 'Keine passenden Wertpapiere gefunden. Du kannst die Daten manuell eingeben.');
      } catch (e) {
        if (!controller.signal.aborted) { setError((e as Error).message); setStatus(''); }
      }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  async function select(hit: Suggestion) {
    detailRequest.current?.abort();
    const controller = new AbortController(); detailRequest.current = controller;
    setLoadingDetails(true); onBusy(true); setError(''); setStatus(`Lade Stammdaten für ${hit.name} …`);
    try {
      const value = await request<SecurityDetails>(`security-search/${encodeURIComponent(hit.isin)}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const applied = onSelect(value); setResults([]); setStatus(applied ? `${value.name}: Daten übernommen. Bitte prüfen und bei Bedarf ändern. Noch nicht gespeichert.` : 'Die Daten konnten nicht übernommen werden. Bitte den Hinweis im Formular beachten.');
    } catch (e) {
      if (!controller.signal.aborted) { setError((e as Error).message); setStatus(''); }
    } finally {
      if (!controller.signal.aborted) { setLoadingDetails(false); onBusy(false); }
    }
  }
  return <section className="security-lookup" aria-label="Wertpapier auf boerse.de suchen">
    <label className="field"><span>Auf boerse.de suchen</span><input type="search" value={query} maxLength={80} autoComplete="off" disabled={loadingDetails}
      placeholder="Name, WKN oder ISIN, z. B. Allianz" onChange={e => { setQuery(e.target.value); setResults([]); setError(''); setStatus(''); }}
      onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} />
      <small>Ab zwei Zeichen erscheinen Vorschläge. Deine Auswahl füllt die bearbeitbaren Felder aus.</small></label>
    {status && <p role="status" aria-live="polite">{status}</p>}
    {error && <p className="error-box" role="alert">{error}</p>}
    {results.length > 0 && <ul className="security-suggestions">{results.map(hit => <li key={hit.isin}><button type="button" disabled={loadingDetails} onClick={() => void select(hit)}><strong>{hit.name}</strong><small>ISIN {hit.isin}</small></button></li>)}</ul>}
  </section>;
}
