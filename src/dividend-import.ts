export type DividendDraft = {
  depotNumber: string; identifier: string; name: string;
  exDate?: string; bookingDate?: string; quantity?: number; gross?: number; net?: number;
  currency?: string; perShare?: number; exchangeRate?: number;
};

// Read labelled values only. Missing or ambiguous values stay empty for review.
export function parseDividendText(text: string): DividendDraft {
  const t = text.replace(/\u00a0/g, ' ');
  const amount = '(\\d[\\d.]*,\\d+)';
  const number = (pattern: string) => {
    const value = t.match(new RegExp(pattern, 'i'))?.[1];
    return value === undefined ? undefined : Number(value.replaceAll('.', '').replace(',', '.'));
  };
  const date = (label: string) => {
    const m = t.match(new RegExp(`(?:${label})[^\\d\\n]*(\\d{2})\\.(\\d{2})\\.(\\d{4})`, 'i'));
    if (!m) return undefined;
    const iso = `${m[3]}-${m[2]}-${m[1]}`;
    return new Date(`${iso}T12:00:00Z`).toISOString().slice(0, 10) === iso ? iso : undefined;
  };
  const security = t.match(/Nr\.\s*\S+\s+([^\n]+?)\s*\(([A-Z0-9/]+)\)/i);
  const original = number(`Bruttodividende[^\\d\\n]*${amount}\\s*[A-Z]{3}`);
  const currency = t.match(/pro\s+St[üu]ck[^\d\n]*[\d.,]+\s*([A-Z]{3})/i)?.[1]?.toUpperCase();
  const exchangeRate = currency === 'EUR' ? 1 : number(`Devisenkurs[^\\d\\n]*${amount}`);
  return {
    depotNumber: t.match(/Depotnummer\s*:\s*(\S+)/i)?.[1] || '',
    identifier: security?.[2] || '', name: security?.[1]?.trim() || '',
    quantity: number(`\\bSt\\.[^\\d\\n]*${amount}`),
    perShare: number(`pro\\s+St[üu]ck[^\\d\\n]*${amount}`), currency, exchangeRate,
    gross: original !== undefined && exchangeRate && exchangeRate > 0 ? Math.round(original / exchangeRate * 100) / 100 : undefined,
    net: number(`Endbetrag[^\\d\\n]*${amount}\\s*EUR`),
    exDate: date('Ex[ -]?tag'), bookingDate: date('Valuta') || date('Zahlungstag+'),
  };
}
