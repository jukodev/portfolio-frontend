import { PortfolioSelect } from './portfolio-select';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { usePortfolio, type DialogState } from './portfolio-context';
import { Modal } from './portfolio-ui';
import { params, today } from './portfolio-api';
import type { Depot, Dividend, Source, Stock, Transaction } from './portfolio-types';
import type { DividendDraft } from './dividend-import';
import { TransactionImportForm } from './transaction-import-form';
import { SecurityLookup, type SecurityDetails } from './security-lookup';

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function EditForm({ dialog, onClose }: { dialog: DialogState; onClose: () => void }) {
  const c = usePortfolio(); const edit = !!dialog.record; const [error, setError] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [imported, setImported] = useState<Partial<Dividend> | null>(null);
  const [pdfStatus, setPdfStatus] = useState('');
  const [readingPdf, setReadingPdf] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [selectedSecurity, setSelectedSecurity] = useState<SecurityDetails | null>(null);
  const [saveSource, setSaveSource] = useState(false);
  function applySecurity(value: SecurityDetails) {
    const form = formRef.current;
    if (!form) return false;
    setError('');
    const fill = (name: string, text: string) => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
        field.value = text;
        if (field instanceof HTMLSelectElement) field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    if (dialog.kind === 'source') {
      const match = c.stocks.data?.find(stock => stock.isin ? stock.isin.toUpperCase() === value.isin : !!value.wkn && stock.wkn.toUpperCase() === value.wkn.toUpperCase());
      if (!match) { setError('Dieses Wertpapier ist noch nicht angelegt. Bitte zuerst unter Wertpapiere anlegen; dort kannst du die Quelle direkt mitspeichern.'); return false; }
      fill('stockId', String(match.id)); fill('url', value.url); fill('market', value.market); fill('dividendUrl', value.dividendUrl);
    } else {
      fill('name', value.name); fill('isin', value.isin); fill('wkn', value.wkn); fill('symbol', value.symbol); fill('type', value.type);
      setSelectedSecurity(value); setSaveSource(true);
    }
    return true;
  }
  async function importPdf(file: File) {
    setError(''); setReadingPdf(true); setPdfStatus('PDF wird geöffnet …');
    try {
      const { readDividendPdf } = await import('./dividend-pdf');
      const draft: DividendDraft = await readDividendPdf(file, setPdfStatus);
      const depots = c.depots.data?.filter(x => x.nummer.replace(/\s/g, '') === draft.depotNumber.replace(/\s/g, '')) || [];
      const stocks = c.stocks.data?.filter(x => [x.isin, x.wkn].some(id => id && id.toUpperCase() === draft.identifier.toUpperCase())) || [];
      setImported({ ...draft, depotId: depots.length === 1 ? depots[0].id : undefined, stockId: stocks.length === 1 ? stocks[0].id : undefined });
      setPdfStatus(`Beleg gelesen${draft.name ? `: ${draft.name}` : ''}. Bitte alle Werte prüfen, fehlende Felder ergänzen und speichern. Brutto wurde gegebenenfalls in EUR umgerechnet.`);
    } catch (e) { setError((e as Error).message); setPdfStatus(''); }
    finally { setReadingPdf(false); }
  }
  const row = imported || dialog.record;
  const defaultDepot = c.depotId || c.depots.data?.[0]?.id || '';
  const defaultStock = c.stocks.data?.[0]?.id || '';
  const titles = { depot: 'Depot', stock: 'Wertpapier', transaction: 'Transaktion', dividend: 'Dividende', source: 'Kursquelle' };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (readingPdf || loadingSecurity) return; setError(''); const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim(); const n = (key: string) => Number(text(key));
    let path = ''; let body: unknown;
    switch (dialog.kind) {
      case 'depot':
        path = `depots${edit ? `/${(row as Depot).id}?${params({ owner: c.owner })}` : ''}`;
        body = { name: text('name'), number: text('number'), owner: text('owner') }; break;
      case 'stock':
        path = `stocks${edit ? `/${(row as Stock).id}` : ''}`;
        body = { name: text('name'), wkn: text('wkn'), symbol: text('symbol'), isin: text('isin'), type: text('type'), dividendsPerYear: n('dividendsPerYear'), dividendDates: text('dividendDates'), lastDividendEur: n('lastDividendEur'), dividendTaxPercent: n('dividendTaxPercent'), goldWeight: n('goldWeight'), ...(!edit && saveSource ? { source: { url: text('sourceUrl'), market: text('sourceMarket'), dividendUrl: text('sourceDividendUrl') } } : {}) }; break;
      case 'transaction':
        path = `transactions${edit ? `/${(row as Transaction).id}` : ''}?${params({ owner: c.owner })}`;
        body = { stockId: n('stockId'), depotId: n('depotId'), type: text('type'), date: text('date'), bookingDate: text('bookingDate'), quantity: n('quantity'), price: n('price'), fees: n('fees'), taxes: n('taxes'), discount: n('discount'), note: text('note') }; break;
      case 'dividend':
        path = `dividends${edit ? `/${(row as Dividend).id}` : ''}?${params({ owner: c.owner })}`;
        body = { stockId: n('stockId'), depotId: n('depotId'), exDate: text('exDate'), bookingDate: text('bookingDate'), quantity: n('quantity'), gross: n('gross'), net: n('net'), currency: text('currency'), perShare: n('perShare'), exchangeRate: n('exchangeRate') }; break;
      case 'source':
        path = `sources${edit ? `/${(row as Source).id}` : ''}`; body = { stockId: n('stockId'), url: text('url'), market: text('market'), dividendUrl: text('dividendUrl') }; break;
    }
    try { await c.save(path, body, edit ? 'PUT' : 'POST'); onClose(); } catch (e) { setError((e as Error).message); }
  }
  const tx = row as Transaction | undefined; const dividend = row as Dividend | undefined; const stock = row as Stock | undefined; const depot = row as Depot | undefined; const source = row as Source | undefined;
  const selectors = <><Field label="Depot"><PortfolioSelect required name="depotId" defaultValue={(dialog.kind === 'dividend' ? dividend?.depotId : tx?.depotId) || (imported ? '' : defaultDepot)}><option value="" disabled>Depot auswählen</option>{c.depots.data?.map(x => <option key={x.id} value={x.id}>{x.bezeichnung}</option>)}</PortfolioSelect></Field><Field label="Wertpapier"><PortfolioSelect required name="stockId" defaultValue={(dialog.kind === 'dividend' ? dividend?.stockId : tx?.stockId) || (imported ? '' : defaultStock)}><option value="" disabled>Wertpapier auswählen</option>{c.stocks.data?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</PortfolioSelect></Field></>;
  if (dialog.kind === 'transaction' && !edit && importMode)
    return <TransactionImportForm onClose={onClose} onSingle={() => setImportMode(false)} />;
  return <Modal title={`${titles[dialog.kind]} ${edit ? 'bearbeiten' : dialog.kind === 'transaction' || dialog.kind === 'dividend' ? 'erfassen' : 'anlegen'}`} onClose={onClose}><form ref={formRef} key={imported ? JSON.stringify(imported) : "manual"} onSubmit={submit}>
    {((dialog.kind === 'stock' && !edit) || dialog.kind === 'source') && <SecurityLookup onSelect={applySecurity} onBusy={setLoadingSecurity} />}
    {dialog.kind === 'transaction' && !edit && <div className="table-tools"><div className="segments" aria-label="Erfassungsart"><button type="button" aria-pressed={true}>Einzeln</button><button type="button" aria-pressed={false} onClick={() => setImportMode(true)}>Tabelle importieren</button></div></div>}
    {dialog.kind === 'dividend' && !edit && <div className="pdf-import"><label className="field"><span>Dividendenabrechnung als PDF</span><input type="file" accept="application/pdf,.pdf" disabled={readingPdf || c.busy} onChange={e => { const file = e.target.files?.[0]; if (file) void importPdf(file); e.target.value = ''; }} /><small>Auch gescannte Belege. Die PDF wird ausschließlich auf diesem Gerät gelesen.</small></label>{pdfStatus && <p role="status" aria-live="polite">{pdfStatus}</p>}</div>}
    {dialog.kind === 'depot' && <div className="form-grid"><Field label="Bezeichnung"><input required name="name" maxLength={200} defaultValue={depot?.bezeichnung} placeholder="z. B. Langfristiges Depot" /></Field><Field label="Depotnummer"><input required name="number" maxLength={100} defaultValue={depot?.nummer} /></Field><Field label="Besitzer" hint={edit ? 'Der Besitzer bleibt diesem Depot zugeordnet.' : 'Für eine weitere Person einen neuen Namen eintragen. Sie erscheint anschließend in der Benutzerauswahl.'}><input required name="owner" readOnly={edit} maxLength={200} defaultValue={depot?.besitzer || c.owner} placeholder="Name der Person" /></Field></div>}
    {dialog.kind === 'stock' && <><p className="form-info">Wertpapier-Stammdaten werden von allen Besitzern gemeinsam verwendet.</p><div className="form-grid"><Field label="Name"><input required name="name" defaultValue={stock?.name} /></Field><Field label="Anlageart"><PortfolioSelect name="type" defaultValue={stock?.typ || 'Aktie'}>{['Aktie', 'ETF', 'Fonds', 'Gold', 'Sonstiges', ...(stock?.typ && !['Aktie', 'ETF', 'Fonds', 'Anleihe', 'ETC', 'ETN', 'Zertifikat', 'Gold', 'Sonstiges'].includes(stock.typ) ? [stock.typ] : [])].map(x => <option key={x}>{x}</option>)}</PortfolioSelect></Field><Field label="Symbol"><input name="symbol" defaultValue={stock?.symbol} /></Field><Field label="WKN"><input name="wkn" defaultValue={stock?.wkn} /></Field><Field label="ISIN"><input name="isin" defaultValue={stock?.isin} /></Field><Field label="Goldgewicht" hint="Gespeicherte Zusatzinformation; ohne automatische Kursumrechnung."><input type="number" min="0" step="any" name="goldWeight" defaultValue={stock?.goldgewicht || 0} /></Field></div><h3 className="form-section">Dividendenprognose</h3><div className="form-grid"><Field label="Ausschüttungen pro Jahr"><input type="number" min="0" max="365" step="1" name="dividendsPerYear" defaultValue={stock?.dividendenProJahr || 0} /></Field><Field label="Letzte Bruttodividende je Stück (EUR)"><input type="number" min="0" step="any" name="lastDividendEur" defaultValue={stock?.dividendeLetzteBruttoEur || 0} /></Field><Field label="Erwartete Termine" hint="Monat-Tag, durch Komma getrennt. Beispiel: 03-15,06-15,09-15,12-15"><input name="dividendDates" defaultValue={stock?.dividendenTermine} placeholder="03-15,06-15,09-15,12-15" /></Field><Field label="Geschätzter Dividendensteuersatz (%)"><input type="number" min="0" max="100" step="1" name="dividendTaxPercent" defaultValue={stock?.dividendenSteuerProzent ?? 26} /></Field></div></>}
    {dialog.kind === 'transaction' && <><div className="form-grid">{selectors}<Field label="Art"><PortfolioSelect name="type" defaultValue={tx?.type || 'K'}><option value="K">Kauf</option><option value="V">Verkauf</option><option value="G">Gratisaktien</option></PortfolioSelect></Field><Field label="Stückzahl"><input required type="number" min="0.00000001" step="any" name="quantity" defaultValue={tx?.quantity} /></Field><Field label="Transaktionsdatum"><input required type="date" name="date" max={today()} defaultValue={tx?.date.slice(0, 10) || today()} /></Field><Field label="Buchungsdatum"><input required type="date" name="bookingDate" defaultValue={tx?.bookingDate.slice(0, 10) || today()} /></Field><Field label="Kurs je Stück (EUR)"><input required type="number" min="0" step="any" name="price" defaultValue={tx?.price} /></Field><Field label="Gebuchte Spesen (EUR)"><input required type="number" min="0" step="any" name="fees" defaultValue={tx?.fees ?? 0} /></Field><Field label="Gebuchte Steuern (EUR)"><input required type="number" min="0" step="any" name="taxes" defaultValue={tx?.taxes ?? 0} /></Field><Field label="Abschlag" hint="Zusatzinformation; wird nicht automatisch verrechnet."><input type="number" step="any" name="discount" defaultValue={tx?.discount ?? 0} /></Field><Field label="Bemerkung"><textarea name="note" rows={2} defaultValue={tx?.note} /></Field></div><p className="form-info">Verkäufe werden je Depot nach FIFO verrechnet. Gratisaktien am Kaufdatum verteilen dessen Einstand auf die neue Stückzahl.</p></>}
    {dialog.kind === 'dividend' && <><div className="form-grid">{selectors}<Field label="Ex-Tag"><input required type="date" name="exDate" defaultValue={dividend?.exDate?.slice(0, 10) || (imported ? '' : today())} /></Field><Field label="Buchungsdatum"><input required type="date" name="bookingDate" defaultValue={dividend?.bookingDate?.slice(0, 10) || (imported ? '' : today())} /></Field><Field label="Berücksichtigte Stückzahl"><input required type="number" min="0.00000001" step="any" name="quantity" defaultValue={dividend?.quantity} /></Field><Field label="Bruttobetrag gesamt (EUR)"><input required type="number" min="0" step="any" name="gross" defaultValue={dividend?.gross} /></Field><Field label="Nettobetrag gesamt (EUR)"><input required type="number" min="0" step="any" name="net" defaultValue={dividend?.net} /></Field><Field label="Originalwährung"><input required name="currency" minLength={3} maxLength={3} defaultValue={dividend?.currency || (imported ? '' : 'EUR')} /></Field><Field label="Dividende je Stück (Originalwährung)"><input required type="number" min="0" step="any" name="perShare" defaultValue={dividend?.perShare ?? (imported ? '' : 0)} /></Field><Field label="Wechselkurs" hint="Originalwert aus der Abrechnung. Die EUR-Beträge oben sind maßgeblich."><input required type="number" min="0.00000001" step="any" name="exchangeRate" defaultValue={dividend?.exchangeRate || (imported ? '' : 1)} /></Field></div></>}
    {dialog.kind === 'source' && <><div className="form-grid"><Field label="Wertpapier"><PortfolioSelect required name="stockId" defaultValue={source?.stockId || defaultStock}>{c.stocks.data?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</PortfolioSelect></Field><Field label="Handelsplatz"><input name="market" defaultValue={source?.market} placeholder="z. B. Tradegate" /></Field><Field label="Kurs-URL" hint="boerse.de-Adresse mit EUR-Kurs. Mehrere Quellen dienen als Ersatz bei Ausfällen."><input required type="url" name="url" defaultValue={source?.url} placeholder="https://www.boerse.de/realtime-kurse/…" /></Field><Field label="Dividenden-URL (optional)" hint="Als Referenz gespeichert; Ausschüttungen werden anhand deiner Abrechnung gebucht."><input type="url" name="dividendUrl" defaultValue={source?.dividendUrl} /></Field></div></>}
    {dialog.kind === 'stock' && !edit && selectedSecurity && <section className="security-source"><label className="source-choice"><input type="checkbox" checked={saveSource} onChange={e => setSaveSource(e.target.checked)} /> boerse.de-Kursquelle zusammen mit dem Wertpapier speichern</label>
      {saveSource && <div className="form-grid" key={selectedSecurity.isin}><Field label="Kurs-URL" hint="Bitte Quelle und EUR-Kurs prüfen."><input required type="url" name="sourceUrl" defaultValue={selectedSecurity.url} /></Field><Field label="Handelsplatz"><input name="sourceMarket" defaultValue={selectedSecurity.market} /></Field><Field label="Dividenden-URL (optional)"><input type="url" name="sourceDividendUrl" defaultValue={selectedSecurity.dividendUrl} /></Field></div>}</section>}
    {error && <div className="error-box" role="alert">{error}</div>}
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit" disabled={c.busy || readingPdf || loadingSecurity}>{c.busy ? 'Speichert …' : 'Speichern'}</button></div>
  </form></Modal>;
}
