export type ImportedTransaction = {
  line: number; date: string; quantity: number; quotedPrice: number; total: number;
  price: number; note: string;
};
export type ImportResult = { rows: ImportedTransaction[]; errors: string[] };

function amount(raw: string): number {
  const value = raw.replace(/(?:EUR|€)/gi, '').replace(/[\s\u00a0\u202f]/g, '');
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(value))
    throw new Error(`Ungültige deutsche Zahl: „${raw}“.`);
  const parsed = Number(value.replaceAll('.', '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed >= 1e16) throw new Error('Betrag ist zu groß.');
  return parsed;
}

export function parseTransactionImport(text: string, maxDate: string): ImportResult {
  const rows: ImportedTransaction[] = []; const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const content = trimmed.replace(/^\|/, '').replace(/\|$/, '');
    const cells = content.split(content.includes('|') ? '|' : content.includes('\t') ? '\t' : content.includes(';') ? ';' : /\s{2,}/).map(x => x.trim());
    if (cells.every(x => /^:?-{3,}:?$/.test(x))) return;
    if (/^datum$/i.test(cells[0])) return;
    try {
      if (cells.length !== 4 && cells.length !== 5)
        throw new Error('Erwartet: Datum, Stück/nominal, Einstandskurs, Gesamtwert und optional Vorabpauschale.');
      const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(cells[0]);
      if (!match) throw new Error('Datum bitte als TT.MM.JJJJ angeben.');
      const [, day, month, year] = match;
      const date = `${year}-${month}-${day}`;
      const calendar = new Date(`${date}T12:00:00Z`);
      if (Number(year) < 1900 || !Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== date || date > maxDate)
        throw new Error('Ungültiges oder zukünftiges Datum.');
      const quantity = amount(cells[1]); const quotedPrice = amount(cells[2]); const total = amount(cells[3]);
      if (quantity < 0.00000001 || Math.abs(quantity - Number(quantity.toFixed(8))) > 1e-10 || quotedPrice <= 0 || total <= 0)
        throw new Error('Stückzahl, Kurs und Gesamtwert müssen positiv sein; Stückzahl mit höchstens 8 Nachkommastellen.');
      const price = Number((total / quantity).toFixed(8));
      if (!Number.isFinite(price) || price <= 0 || price >= 1e16 || Math.abs(price * quantity - total) > 0.005)
        throw new Error('Gesamtwert lässt sich mit dieser Stückzahl nicht centgenau speichern.');
      // Allow rounding in the displayed unit price, but reject a different column order or inconsistent totals.
      if (Math.abs(quotedPrice * quantity - total) > quantity * 0.005 + 0.011)
        throw new Error('Gesamtwert passt nicht zu Stückzahl und Einstandskurs (auch unter Berücksichtigung der Kursrundung).');
      const advance = cells.length === 5 ? amount(cells[4]) : undefined;
      const note = `Tabellenimport: Einstandskurs ${cells[2]}, Gesamtwert ${cells[3]}.${advance !== undefined ? ` Vorabpauschale ${cells[4]} (nur Information; nicht verrechnet).` : ''}`;
      rows.push({ line, date, quantity, quotedPrice, total, price, note });
    } catch (error) { errors.push(`Zeile ${line}: ${(error as Error).message}`); }
  });
  if (rows.length > 1000) errors.push('Bitte höchstens 1000 Transaktionen auf einmal importieren.');
  return { rows, errors };
}
