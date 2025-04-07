/* eslint-disable style/multiline-ternary */
interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockData {
  "1m": OHLCV[];
  "15m": OHLCV[];
  "1h": OHLCV[];
  "1d": OHLCV[];
}

/**
 * Generate realistic stock price data for multiple timeframes.
 *
 * @param {object} options - Configuration options
 * @param {number} options.days - Number of days to generate data for
 * @param {[number, number]} options.priceRange - The [min, max] price range for the stock
 * @param {number} options.volatility - Base volatility of the stock
 * @param {number} options.trend - Overall trend direction and strength (positive = upward, negative = downward)
 * @param {number | null} options.seed - Random seed for reproducibility
 * @param {string | null} options.startDate - Optional start date string (e.g., "2023-01-01T00:00:00Z"). Defaults to current date.
 * @returns {StockData} - Object containing price data for different timeframes
 */
function generateStockData({
  days = 30,
  priceRange = [0.001, 0.002],
  volatility = 0.1,
  trend = 0.01,
  seed = null,
  startDate = null,
}: {
  days?: number;
  priceRange?: [number, number];
  volatility?: number;
  trend?: number;
  seed?: number | null;
  startDate?: string | null;
} = {}): StockData {
  // Seed random number generator if seed is provided
  // Note: JS doesn't have a built-in way to fully seed the RNG,
  // but we can create a simple deterministic RNG
  const rng = seed != null ? createSeededRandom(seed) : Math.random;

  // Calculate number of minutes in the simulation
  const totalMinutes = days * 24 * 60;

  // Generate base minute-by-minute price movements
  // Starting with a random price within the range
  const startPrice = priceRange[0] + rng() * (priceRange[1] - priceRange[0]);

  // Create base price series with normal distribution for returns
  const returns: number[] = Array.from({ length: totalMinutes }, () =>
    normalRandom(trend, volatility, rng));

  let baseDate: Date;
  if (startDate) {
    baseDate = new Date(startDate);
  }
  else {
    baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
  }

  // Adjust volatility based on market hours and add time patterns
  for (let i = 0; i < totalMinutes; i++) {
    // Non-market hours have lower volatility
    // Opening and closing hours have higher volatility
    const minuteDate = new Date(baseDate.getTime() + i * 60000);
    const hour = minuteDate.getHours();
    const minute = minuteDate.getMinutes();

    // Market open (9:30-10:30) - higher volatility
    if ((hour === 9 && minute >= 30) || (hour === 10 && minute < 30)) {
      returns[i] *= 1.5;
    }

    // Market close (15:00-16:00) - higher volatility
    else if (hour === 15) {
      returns[i] *= 1.4;
    }
  }

  // Calculate cumulative returns
  const cumulativeReturns: number[] = [];
  let cumulativeReturn = 1;

  for (const ret of returns) {
    cumulativeReturn *= (1 + ret);
    cumulativeReturns.push(cumulativeReturn);
  }

  const prices = cumulativeReturns.map(cr => startPrice * cr);

  // Ensure prices stay within range by applying a scaling/shifting transformation
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Apply scaling and shifting to keep prices in desired range
  const rangeWidth = priceRange[1] - priceRange[0];
  const currentWidth = maxPrice - minPrice;

  const scaledPrices = prices.map(price =>
    ((price - minPrice) / currentWidth) * rangeWidth + priceRange[0],
  );

  // Create time series
  const timestamps = Array.from({ length: totalMinutes }, (_, i) =>
    new Date(baseDate.getTime() + i * 60000));

  // Create minute dataframe
  const df1m: OHLCV[] = [];

  for (let i = 0; i < totalMinutes; i++) {
    const close = scaledPrices[i];
    const open = i > 0 ? scaledPrices[i - 1] : close * (1 - rng() * volatility);

    // Generate high and low based on volatility
    const volFactor = volatility * 2;
    const base = Math.min(close, open);

    // High is above the higher of open and close
    const highOffset = rng() * volFactor * base;
    // Low is below the lower of open and close
    const lowOffset = rng() * volFactor * base;

    const high = Math.min(Math.max(close, open) + highOffset, priceRange[1]);
    const low = Math.max(base - lowOffset, priceRange[0]);

    // Generate volume - higher during market hours and proportional to price movement
    const volumeBase = 100000; // Base volume
    let volume = poissonRandom(volumeBase, rng);

    // Adjust volume based on market hours
    volume *= 0.1 + rng() * 0.2; // 0.1 to 0.3

    // Volume increases with price movement (volatility)
    if (i > 0) {
      const priceChange = Math.abs(close - scaledPrices[i - 1]);
      const priceChangeFactor = 1 + (priceChange / close) * 100;
      volume *= priceChangeFactor;
    }

    df1m.push({
      timestamp: timestamps[i],
      open,
      high,
      low,
      close,
      volume: Math.floor(volume),
    });
  }

  // Generate dataframes for other timeframes
  const result: StockData = {
    "1m": df1m,
    "15m": resampleOHLC(df1m, 15),
    "1h": resampleOHLC(df1m, 60),
    "1d": resampleOHLC(df1m, 1440),
  };

  return result;
}

/**
 * Resample minute data to create OHLCV data for a larger timeframe
 */
function resampleOHLC(data: OHLCV[], minutesPerCandle: number): OHLCV[] {
  const result: OHLCV[] = [];

  // Group by time periods
  for (let i = 0; i < data.length; i += minutesPerCandle) {
    const group = data.slice(i, i + minutesPerCandle);

    if (group.length === 0)
      continue;

    // Get first timestamp in group
    const timestamp = group[0].timestamp;

    // Create OHLCV data
    const candle: OHLCV = {
      timestamp,
      open: group[0].open,
      high: Math.max(...group.map(item => item.high)),
      low: Math.min(...group.map(item => item.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((sum, item) => sum + item.volume, 0),
    };

    result.push(candle);
  }

  return result;
}

/**
 * Generate a normal random number using Box-Muller transform
 */
function normalRandom(mean: number, stdDev: number, rng: () => number): number {
  const u1 = rng();
  const u2 = rng();

  // Box-Muller transform
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Apply mean and standard deviation
  return mean + z0 * stdDev;
}

/**
 * Generate a Poisson random number
 * This is a simplified implementation adequate for large lambda values
 */
function poissonRandom(lambda: number, rng: () => number): number {
  // For large lambda, normal approximation works well
  return Math.max(0, Math.round(normalRandom(lambda, Math.sqrt(lambda), rng)));
}

/**
 * Create a seeded random number generator
 */
function createSeededRandom(seed: number): () => number {
  return function () {
    // Simple xorshift algorithm
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    // Normalize to [0, 1)
    return (seed < 0 ? ~seed + 1 : seed) % 1000000 / 1000000;
  };
}

/**
 * Plot candlestick chart data to the console (ASCII representation)
 */
function consolePlotCandlestick(data: OHLCV[], title: string): void {
  console.log(`\n=== ${title} ===`);

  // Get min and max prices for scaling
  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));

  // Print a simple text-based chart
  console.log(`Price range: ${minPrice.toFixed(6)} - ${maxPrice.toFixed(6)}`);
  console.log(`Candles: ${data.length}`);
  console.log(`First date: ${data[0].timestamp.toISOString()}`);
  console.log(`Last date: ${data[data.length - 1].timestamp.toISOString()}`);
}

/**
 * Demo function to show how to use the stock generator
 */
function demoStockGenerator(): void {
  console.log("Generating stock data...");

  const specificStartDate = "2024-01-01T00:00:00Z";

  const data = generateStockData({
    days: 30,
    priceRange: [0.001, 0.002],
    volatility: 0.01,
    trend: 0.01,
    seed: 42,
    startDate: specificStartDate,
  });

  for (const [timeframe, prices] of Object.entries(data)) {
    consolePlotCandlestick(
      timeframe === "1m" ? prices.slice(-390) // Show just one trading day for 1m
        : timeframe === "15m" ? prices.slice(-8 * 24) // Show about a week for 15m
          : prices, // Show all for 1h and 1d
      `Stock Price (${timeframe} timeframe)`,
    );
  }

  // For real usage in a browser or Node.js environment,
  // you would use a proper charting library like Chart.js, D3, or TradingView
  console.log("\nTo visualize this data properly, use a charting library like Chart.js or D3.js");
}

// Example usage for browser:
/*
  // Generate 30 days of stock data
  const data = generateStockData({
    days: 30,
    priceRange: [0.001, 0.002]
  });

  // Access different timeframes
  const minuteData = data['1m'];
  const hourlyData = data['1h'];
  const dailyData = data['1d'];

  // Then use a charting library like Chart.js or TradingView to visualize the data
  */

// Export functions for use in other modules
export {
  consolePlotCandlestick,
  demoStockGenerator,
  generateStockData,
  type OHLCV,
  resampleOHLC,
  type StockData,
};
