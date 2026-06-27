// Node 3: Financial Data Fetcher
// Fetches stock price, financial ratios, and metrics from Yahoo Finance

import { ResearchState } from '../state';
import { StreamStep, FinancialData } from '@/types/research';
import { v4 as uuidv4 } from 'uuid';

async function fetchYahooFinance(ticker: string): Promise<FinancialData> {
  try {
    // Dynamic import to avoid SSR issues
    const yahooFinance = (await import('yahoo-finance2')).default;

    const [quoteResult, summaryResult] = await Promise.allSettled([
      yahooFinance.quote(ticker) as Promise<any>,
      yahooFinance.quoteSummary(ticker, {
        modules: [
          'financialData',
          'defaultKeyStatistics',
          'incomeStatementHistory',
          'balanceSheetHistory',
          'cashflowStatementHistory',
          'earningsTrend',
        ],
      }) as Promise<any>,
    ]);

    const quoteData: any = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    const summaryData: any = summaryResult.status === 'fulfilled' ? summaryResult.value : null;

    const financial = summaryData?.financialData;
    const keyStats = summaryData?.defaultKeyStatistics;
    const incomeHistory = summaryData?.incomeStatementHistory?.incomeStatementHistory;

    // Build revenue history
    const revenueHistory = incomeHistory
      ? incomeHistory
          .slice(0, 4)
          .reverse()
          .map((s: any) => ({
            period: new Date(s.endDate).getFullYear().toString(),
            value: s.totalRevenue?.raw || 0,
          }))
      : undefined;

    return {
      ticker,
      exchange: quoteData?.fullExchangeName || undefined,
      currency: quoteData?.currency || 'USD',
      currentPrice: quoteData?.regularMarketPrice || undefined,
      marketCap: quoteData?.marketCap || undefined,
      peRatio: quoteData?.trailingPE || financial?.trailingPE?.raw || undefined,
      pbRatio: keyStats?.priceToBook?.raw || undefined,
      evEbitda: keyStats?.enterpriseToEbitda?.raw || undefined,
      revenueAnnual: financial?.totalRevenue?.raw || undefined,
      revenueGrowthYoY: financial?.revenueGrowth?.raw
        ? financial.revenueGrowth.raw * 100
        : undefined,
      netIncomeMargin: financial?.profitMargins?.raw
        ? financial.profitMargins.raw * 100
        : undefined,
      ebitdaMargin: financial?.ebitdaMargins?.raw
        ? financial.ebitdaMargins.raw * 100
        : undefined,
      debtToEquity: financial?.debtToEquity?.raw || undefined,
      currentRatio: financial?.currentRatio?.raw || undefined,
      freeCashFlow: financial?.freeCashflow?.raw || undefined,
      week52High: quoteData?.fiftyTwoWeekHigh || undefined,
      week52Low: quoteData?.fiftyTwoWeekLow || undefined,
      dividendYield: quoteData?.dividendYield
        ? quoteData.dividendYield * 100
        : undefined,
      beta: quoteData?.beta || undefined,
      earningsPerShare: quoteData?.epsTrailingTwelveMonths || undefined,
      returnOnEquity: financial?.returnOnEquity?.raw
        ? financial.returnOnEquity.raw * 100
        : undefined,
      analystRating: financial?.recommendationKey || undefined,
      priceTarget: financial?.targetMeanPrice?.raw || undefined,
      revenueHistory,
    };
  } catch (err) {
    console.warn(`Yahoo Finance fetch failed for ${ticker}:`, err);
    return { ticker, error: String(err) };
  }
}

// Try alternate ticker formats for Indian stocks
async function fetchFinancialDataWithFallback(
  ticker: string,
  exchange: string
): Promise<FinancialData> {
  const tickersToTry = [ticker];

  // Indian stock exchanges
  if (exchange === 'NSE' || exchange?.includes('NSE')) {
    tickersToTry.push(`${ticker}.NS`, ticker.replace('.NS', '').replace('.BO', '') + '.NS');
  }
  if (exchange === 'BSE' || exchange?.includes('BSE')) {
    tickersToTry.push(`${ticker}.BO`);
  }
  if (!ticker.includes('.')) {
    tickersToTry.push(`${ticker}.NS`, `${ticker}.BO`);
  }

  for (const t of tickersToTry) {
    const data = await fetchYahooFinance(t);
    if (!data.error && (data.currentPrice || data.marketCap)) {
      return data;
    }
  }

  return fetchYahooFinance(tickersToTry[tickersToTry.length - 1]);
}

export async function financialFetcherNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const stepId = uuidv4();
  const startTime = Date.now();

  const startStep: StreamStep = {
    id: stepId,
    name: 'financialFetcher',
    label: '📊 Fetching Financial Data',
    status: 'running',
    timestamp: new Date().toISOString(),
  };

  const ticker = state.ticker || state.companyName.replace(/\s+/g, '');

  try {
    const financialData = await fetchFinancialDataWithFallback(ticker, state.exchange || '');

    const metrics = [];
    if (financialData.currentPrice) metrics.push(`Price: ${financialData.currency} ${financialData.currentPrice.toFixed(2)}`);
    if (financialData.marketCap) metrics.push(`Mkt Cap: ${(financialData.marketCap / 1e9).toFixed(1)}B`);
    if (financialData.peRatio) metrics.push(`P/E: ${financialData.peRatio.toFixed(1)}x`);

    const doneStep: StreamStep = {
      ...startStep,
      status: 'done',
      output: financialData.error
        ? `Limited data available: ${financialData.error}`
        : `Fetched ${metrics.join(' | ')}`,
      durationMs: Date.now() - startTime,
    };

    return {
      financialData,
      steps: [startStep, doneStep],
    };
  } catch (err) {
    const errorStep: StreamStep = {
      ...startStep,
      status: 'error',
      output: `Financial data fetch failed: ${err}`,
      durationMs: Date.now() - startTime,
    };
    return {
      financialData: { ticker, error: String(err) },
      steps: [startStep, errorStep],
      errors: [`financialFetcher: ${err}`],
    };
  }
}
