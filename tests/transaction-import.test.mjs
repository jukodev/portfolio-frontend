import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/transaction-import.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { parseTransactionImport: parse } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const maxDate = '2026-11-15';

test('imports the supplied Markdown including its separator after the first data row', () => {
  const result = parse(`| 17.03.2025 | 5,1027 | 97,99 € | 500,00 € | 7,88 € |
| :--------- | -----: | -------: | -------: | -----: |
| 17.02.2025 | 4,6097 | 108,47 € | 500,00 € | 7,83 € |`, maxDate);
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].date, '2025-03-17');
  assert.equal(result.rows[0].quantity, 5.1027);
  assert.equal(result.rows[0].quotedPrice, 97.99);
  for (const row of result.rows) assert.equal(Math.round(row.quantity * row.price * 100), 50000);
  assert.match(result.rows[0].note, /Vorabpauschale 7,88 €/);
});

test('supports a header, clipboard tabs, German thousands and optional fifth column', () => {
  const result = parse('Datum\tStück/nominal\tEinstandskurs\tGesamtwert\n17.02.2025\t10,5\t123,45 EUR\t1.296,23 €', maxDate);
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows[0].total, 1296.23);
  assert.equal(parse('17.02.2025;10;100,00;1.000,00;0,00', maxDate).rows.length, 1);
});

test('reports every bad row without silently importing invalid dates, numbers or column orders', () => {
  for (const line of [
    '31.02.2025;1;100;100', '16.11.2026;1;100;100', '17.02.2025;0;100;100',
    '17.02.2025;-1;100;100', '17.02.2025;1;100;500', '17.02.2025;1;100;100;abc',
    '17.02.2025;1x;100;100', '17.02.2025;0,000000001;100;100', 'unknown row',
  ]) {
    const result = parse(line, maxDate);
    assert.equal(result.rows.length, 0, line);
    assert.equal(result.errors.length, 1, line);
    assert.match(result.errors[0], /^Zeile 1:/);
  }
  assert.equal(parse('17.02.2025;1;100;100\nbad row', maxDate).errors.length, 1);
  assert.equal(parse(Array(1001).fill('17.02.2025;1;100;100').join('\n'), maxDate).errors.length, 1);
});
