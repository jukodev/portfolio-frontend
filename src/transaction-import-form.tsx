import { PortfolioSelect } from './portfolio-select';
import { useState, type FormEvent } from 'react';
import { usePortfolio } from './portfolio-context';
import { Modal } from './portfolio-ui';
import { eur, params, today } from './portfolio-api';
import { parseTransactionImport } from './transaction-import';

const example = '| 17.03.2025 | 5,1027 | 97,99 € | 500,00 € | 7,88 € |\n| :--------- | -----: | -------: | -------: | -----: |\n| 17.02.2025 | 4,6097 | 108,47 € | 500,00 € | 7,83 € |';

export function TransactionImportForm({ onClose, onSingle }: { onClose: () => void; onSingle: () => void }) {
  const c = usePortfolio();
  const [text, setText] = useState(''); const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const result = parseTransactionImport(text, today());
  const blocked = saving || c.busy;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked || result.errors.length || !result.rows.length) return;
    setError(''); setSaving(true);
    const form = new FormData(event.currentTarget);
    const stockId = Number(form.get('stockId')); const depotId = Number(form.get('depotId'));
    const body = result.rows.map(row => ({ stockId, depotId, type: 'K', date: row.date, bookingDate: row.date,
      quantity: row.quantity, price: row.price, fees: 0, taxes: 0, discount: 0, note: row.note }));
    try { await c.save(`transactions/import?${params({ owner: c.owner })}`, body); onClose(); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  return <Modal title="Transaktionen importieren" onClose={blocked ? () => {} : onClose}>
    <form onSubmit={submit}>
      <fieldset disabled={blocked} className="transaction-import-fields">
        <div className="table-tools"><div className="segments" aria-label="Erfassungsart"><button type="button" aria-pressed={false} onClick={onSingle}>Einzeln</button><button type="button" aria-pressed={true}>Tabelle importieren</button></div></div>
        <div className="form-grid">
          <label className="field"><span>Depot für alle Zeilen</span><PortfolioSelect required name="depotId" defaultValue={c.depotId || c.depots.data?.[0]?.id || ''}><option value="" disabled>Depot auswählen</option>{c.depots.data?.map(x => <option key={x.id} value={x.id}>{x.bezeichnung}</option>)}</PortfolioSelect></label>
          <label className="field"><span>Wertpapier für alle Zeilen</span><PortfolioSelect required name="stockId" defaultValue={c.stocks.data?.[0]?.id || ''}><option value="" disabled>Wertpapier auswählen</option>{c.stocks.data?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</PortfolioSelect></label>
        </div>
        <p className="form-info">Alle Zeilen werden als Käufe ohne zusätzliche Spesen oder Steuern erfasst. Das Datum gilt auch als Buchungsdatum. Bereits vorhandene Transaktionen werden nicht automatisch erkannt.</p>
        <label className="field"><span>Tabelle einfügen</span><textarea rows={7} value={text} onChange={e => { setText(e.target.value); setError(''); }} placeholder={example} aria-describedby="transaction-import-help" spellCheck={false} />
          <small id="transaction-import-help">Spalten: Datum · Stück/nominal · Einstandskurs · Gesamtwert · Vorabpauschale (optional). Deutsche Zahlen, z. B. 1.234,56 €. Markdown-Tabellen, Tabulatoren und Semikolons werden unterstützt; Kopf- und Trennzeilen sind optional.</small>
        </label>
        <p className="form-info">Der Gesamtwert ist maßgeblich: Der gespeicherte Kurs wird aus Gesamtwert ÷ Stückzahl berechnet, um Rundungen des angezeigten Einstandskurses auszugleichen. Der ursprüngliche Kurs und eine vorhandene Vorabpauschale bleiben in der Bemerkung erhalten. Die Vorabpauschale wird nicht verrechnet; die Steuerschätzung berücksichtigt sie nicht.</p>
        {result.errors.length > 0 && <div className="error-box" role="alert"><ul>{result.errors.map((message, i) => <li key={i}>{message}</li>)}</ul>Es wurde noch nichts importiert. Bitte korrigiere die betroffenen Zeilen.</div>}
        {result.rows.length > 0 && <><h3 className="form-section">Vorschau: {result.rows.length} Käufe · {eur(result.rows.reduce((sum, row) => sum + row.total, 0))}</h3>
          <div className="table-scroll transaction-import-preview"><table><thead><tr><th>Datum</th><th>Stück/nominal</th><th>Einstandskurs</th><th>Gesamtwert</th></tr></thead><tbody>{result.rows.map(row => <tr key={row.line}><td>{row.date.split('-').reverse().join('.')}</td><td>{row.quantity.toLocaleString('de-DE', { maximumFractionDigits: 8 })}</td><td>{eur(row.quotedPrice)}</td><td>{eur(row.total)}</td></tr>)}</tbody></table></div></>}
        {error && <div className="error-box" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" type="submit" disabled={blocked || !result.rows.length || result.errors.length > 0}>{blocked ? 'Importiert …' : `${result.rows.length || ''} Käufe importieren`}</button></div>
      </fieldset>
    </form>
  </Modal>;
}
