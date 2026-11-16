import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/dividend-import.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { parseDividendText: parse } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const sample = `Ihre Depotnummer: 1234567
Nr.1234 BANK OF NOVA SCOTIA, THE (CA1234/1234)
St. : 25,000000 Bruttodividende
pro Stück ! 1,1400 CAD Extag : 06.10.2026 Bruttodividende:: 28,50 CAD
Zahlungstagg : 28.10.2026 Bemessungs-
Valuta : 28.10.2026 grundlage ! 7,31 EUR
*Einbeh. Steuer : 1,93 EUR
Devisenkurs : 1,563600
Quellenst.-satz : 25,00% Gez. Quellenst. : 7,13 CAD
Endbetrag R 11,74 EUR`;
test('extracts scanned foreign dividend without mistaking tax base for gross', () => {
  const d = parse(sample);
  assert.equal(d.quantity, 25); assert.equal(d.perShare, 1.14);
  assert.equal(d.currency, 'CAD'); assert.equal(d.exchangeRate, 1.5636);
  assert.equal(d.gross, 18.23); assert.equal(d.net, 11.74);
  assert.equal(d.exDate, '2026-10-06'); assert.equal(d.bookingDate, '2026-10-28');
  assert.equal(d.depotNumber, '1234567'); assert.equal(d.identifier, 'CA1234/1234');
});
test('missing foreign exchange rate never invents an EUR gross value', () => {
  assert.equal(parse(sample.replace('Devisenkurs : 1,563600', '')).gross, undefined);
  assert.equal(parse('unrelated document').quantity, undefined);
  assert.equal(parse('unrelated document').bookingDate, undefined);
});
test('EUR dividend needs no conversion and German thousands are preserved', () => {
  const d = parse(sample.replaceAll('CAD', 'EUR').replace('28,50 EUR', '1.228,50 EUR'));
  assert.equal(d.exchangeRate, 1); assert.equal(d.gross, 1228.5);
});
