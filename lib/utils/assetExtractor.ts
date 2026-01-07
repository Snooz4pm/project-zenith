/**
 * Asset Extractor for Trading Intelligence Feed
 * Extracts trading assets (crypto, stocks, forex) from news text
 */

// Asset detection patterns
const ASSET_PATTERNS = {
  crypto: /\b(BTC|ETH|SOL|USDT|XRP|DOGE|ADA|BNB|DOT|MATIC|AVAX|LINK|UNI|ATOM|LTC|BCH|XLM|ALGO|VET|FIL|AAVE|COMP|SNX|CRV|SUSHI|YFI|MKR|NEAR|FTM|SAND|MANA|AXS|GALA|ENJ|CHZ|BAT|ZRX|OMG|STORJ|GRT|1INCH|UMA|REN|LRC|KNC|ANT|MLN|NMR|REP|ZEC|DASH|XMR|ETC|ZEN|ZIL|ICX|ONT|QTUM|WAVES|LSK|STRAT|ARK|NANO|SC|DCR|DGB|RVN|BTG|BTT|TRX|XTZ|EOS|IOTA|NEO|VEN)\b/gi,
  stocks: /\b(AAPL|MSFT|GOOGL|AMZN|NVDA|META|TSLA|BRK\.?B|V|JPM|JNJ|WMT|PG|MA|HD|DIS|PYPL|NFLX|ADBE|CRM|CSCO|PFE|NKE|INTC|AMD|QCOM|TXN|AVGO|ORCL|COST|ACN|TMO|ABT|UNH|MCD|CVX|XOM|LLY|MDT|BMY|HON|UPS|SBUX|NEE|BA|CAT|GE|MMM|IBM|MRK|DHR|AMGN|GS|MS|C|BAC|WFC|USB|PNC|TFC|BK|STT|SCHW|AXP|COF|DFS|SYF|AIG|PRU|MET|AFL|ALL|TRV|PGR|CB|CNA|HIG|LNC|UNM|AFL)\b/gi,
  forex: /\b(EUR\/USD|EURUSD|GBP\/USD|GBPUSD|USD\/JPY|USDJPY|AUD\/USD|AUDUSD|USD\/CAD|USDCAD|USD\/CHF|USDCHF|NZD\/USD|NZDUSD|EUR\/GBP|EURGBP|EUR\/JPY|EURJPY|GBP\/JPY|GBPJPY)\b/gi,
};

/**
 * Extract trading assets from text
 * @param text - Combined title + article text
 * @returns Array of unique asset symbols (max 3)
 */
export function extractAssets(text: string): string[] {
  const assets = new Set<string>();

  // Match crypto symbols
  const cryptoMatches = text.match(ASSET_PATTERNS.crypto);
  if (cryptoMatches) {
    cryptoMatches.forEach(m => assets.add(m.toUpperCase()));
  }

  // Match stock tickers
  const stockMatches = text.match(ASSET_PATTERNS.stocks);
  if (stockMatches) {
    stockMatches.forEach(m => assets.add(m.toUpperCase().replace('.', '')));
  }

  // Match forex pairs
  const forexMatches = text.match(ASSET_PATTERNS.forex);
  if (forexMatches) {
    forexMatches.forEach(m => {
      // Normalize format: EUR/USD -> EURUSD
      const normalized = m.toUpperCase().replace('/', '');
      assets.add(normalized);
    });
  }

  // Return max 3 assets
  return Array.from(assets).slice(0, 3);
}

/**
 * Calculate impact level from importance score
 * @param importance - Importance score from 0-1
 * @returns Impact level: LOW, MED, or HIGH
 */
export function getImpactLevel(importance: number | null | undefined): 'LOW' | 'MED' | 'HIGH' {
  const score = importance || 0;

  if (score >= 0.7) return 'HIGH';
  if (score >= 0.4) return 'MED';
  return 'LOW';
}

/**
 * Get impact color classes for terminal theme
 * @param level - Impact level
 * @returns Tailwind CSS classes
 */
export function getImpactColorClasses(level: 'LOW' | 'MED' | 'HIGH'): string {
  switch (level) {
    case 'HIGH':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'MED':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'LOW':
      return 'bg-[#2D3F5A] text-gray-500 border-[#2D3F5A]';
  }
}

/**
 * Format relative time in terminal style
 * @param dateString - ISO date string
 * @returns Formatted relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'NOW';
  if (diffMins < 60) return `${diffMins}M`;
  if (diffHours < 24) return `${diffHours}H`;
  if (diffDays < 7) return `${diffDays}D`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}
