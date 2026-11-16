import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/chart-history.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { chartHistory } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('keeps the first purchase and current value without inventing a decade of performance', () => {
  const data = [{ date: '2016-12-01', value: 6030.6, investment: 6037.6, source: 'purchase' }, { date: '2026-11-16', value: 184320.13, investment: 125717.65, source: 'current' }];
  const points = chartHistory(data);
  assert.equal(points.length, 3);
  assert.equal(points[0].value, 6030.6);
  assert.equal(points[1].value, null);
  // The ledger still determines the investment when historical prices are missing.
  assert.equal(points[1].investment, 6037.6);
  assert.equal(points[1].netValue, null);
  assert.equal(points[2].value, 184320.13);
  assert.ok(points[1].timestamp > points[0].timestamp && points[1].timestamp < points[2].timestamp);
  assert.equal(data.length, 2);
});
test('sorts observations chronologically and retains normal weekend gaps and missing quotes', () => {
  const points = chartHistory([{ date: '2026-11-16', value: 120 }, { date: '2026-11-13', value: 100 }, { date: '2026-11-17', value: null }]);
  assert.equal(points.length, 3);
  assert.deepEqual(points.map(x => x.value), [100, 120, null]);
  assert.deepEqual(chartHistory([]), []);
});
