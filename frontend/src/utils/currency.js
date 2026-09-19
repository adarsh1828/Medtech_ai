/**
 * Formats a numeric amount using the Indian numbering system (Lakhs & Crores)
 * e.g. 150000 -> "₹1,50,000.00"
 */
export function formatCurrency(amount, symbol = '₹') {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatCompactCurrency(amount, symbol = '₹') {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString('en-IN', {
    maximumFractionDigits: 0
  })}`;
}
