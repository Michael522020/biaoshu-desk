function cents(value) {
  return Math.round((Number(value) || 0) * 100);
}

export function lineMoney(line) {
  const net = cents((Number(line?.quantity) || 0) * (Number(line?.unitPrice) || 0));
  const tax = Math.round(net * ((Number(line?.taxRate) || 0) / 100));
  return { net: net / 100, tax: tax / 100, gross: (net + tax) / 100 };
}

export function quoteTotal(lines = []) {
  return lines.reduce((sum, line) => {
    const money = lineMoney(line);
    sum.net = Math.round((sum.net + money.net) * 100) / 100;
    sum.tax = Math.round((sum.tax + money.tax) * 100) / 100;
    sum.gross = Math.round((sum.gross + money.gross) * 100) / 100;
    sum.count += 1;
    return sum;
  }, { net: 0, tax: 0, gross: 0, count: 0 });
}

export function blankQuoteLine() {
  return { id: `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name: "", unit: "项", quantity: 1, unitPrice: 0, taxRate: 6 };
}
