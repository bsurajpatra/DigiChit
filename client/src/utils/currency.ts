/**
 * DigiChit Currency Utilities
 * Formats currency values and retrieves currency symbols based on ISO currency codes.
 */

export const getCurrencySymbol = (currencyCode?: string): string => {
    if (!currencyCode) return '₹';
    const code = currencyCode.toUpperCase().trim();
    switch (code) {
        case 'INR': return '₹';
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'JPY': return '¥';
        case 'AED': return 'AED ';
        case 'SGD': return 'S$';
        case 'CAD': return 'C$';
        case 'AUD': return 'A$';
        default:
            try {
                const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).formatToParts(0);
                const symbolPart = parts.find(p => p.type === 'currency');
                return symbolPart ? symbolPart.value : `${code} `;
            } catch {
                return `${code} `;
            }
    }
};

export const formatCurrency = (amount: number, currencyCode?: string): string => {
    const num = isNaN(amount) ? 0 : amount;
    const symbol = getCurrencySymbol(currencyCode);
    const code = (currencyCode || 'INR').toUpperCase().trim();
    const locale = code === 'INR' ? 'en-IN' : 'en-US';
    return `${symbol}${num.toLocaleString(locale)}`;
};
