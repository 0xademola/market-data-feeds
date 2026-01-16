import { feeds } from 'market-data-feeds';
import { MetricsAggregator } from 'market-data-feeds/instrumentation/MetricsHooks';

/**
 * Complete v2.1.0 Feature Showcase
 */

async function enterpriseFeatures() {
    // ===== 1. BATCH PROCESSING (10x faster) =====
    console.log("1. Batch Processing Demo:");
    const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA'];

    // OLD WAY: 5 API calls
    // for (const s of symbols) await feeds.crypto.price(s);

    // NEW WAY: 1 API call
    const prices = await feeds.crypto.pricesBatch(symbols);
    console.log(`Fetched ${prices.length} prices in 1 call`);
    console.table(prices.map(p => ({ Symbol: p.asset, Price: p.price })));

    // ===== 2. ENHANCED ERROR HANDLING =====
    console.log("\n2. Enhanced Error Handling:");
    try {
        await feeds.finance.price('INVALID');
    } catch (e: any) {
        if (e.context) {
            console.log(`Source: ${e.context.source}`);
            console.log(`Status: ${e.context.statusCode}`);
            console.log(`Retryable: ${e.context.isRetryable}`);
            if (e.context.retryAfter) {
                console.log(`Retry after: ${e.context.retryAfter}s`);
            }
        }
    }

    // ===== 3. OBSERVABILITY HOOKS =====
    console.log("\n3. Observability Demo:");
    const metrics = new MetricsAggregator();

    feeds.configure({
        metrics: {
            onRequest: (adapter) => {
                metrics.record(adapter, 'request');
                console.log(`📊 [${adapter}] Request started`);
            },
            onSuccess: (adapter, duration) => {
                metrics.record(adapter, 'success', duration);
                console.log(`✅ [${adapter}] Success in ${duration}ms`);
            },
            onError: (adapter, error) => {
                metrics.record(adapter, 'error');
                console.error(`❌ [${adapter}] Error: ${error.message}`);
            },
            onCacheHit: (adapter) => {
                metrics.record(adapter, 'cacheHit');
                console.log(`💾 [${adapter}] Cache HIT`);
            }
        }
    });

    // Make some requests
    await feeds.crypto.price('BTC');
    await feeds.crypto.price('BTC'); // This will hit cache

    // View stats
    const stats = metrics.getStats('Crypto');
    console.log('\nMetrics:', stats);

    // ===== 4. MULTI-SOURCE FALLBACKS =====
    console.log("\n4. Multi-Source Fallback Demo:");
    // If AlphaVantage fails, falls back to Binance for crypto-like tickers
    try {
        const btcPrice = await feeds.finance.price('BTC');
        console.log(`BTC Price: $${btcPrice.price} (source: ${btcPrice.source})`);
    } catch (e: any) {
        console.error('All sources failed:', e.message);
    }

    // ===== 5. DATA VALIDATION =====
    console.log("\n5. Data Validation (automatic):");
    // All responses are validated with Zod schemas
    // Bad data is caught before it corrupts your system
    const weather = await feeds.weather.current('London');
    console.log(`Weather validated: ${weather.location}, ${weather.temperature}°C`);

    // ===== 6. CIRCUIT BREAKER (automatic) =====
    console.log("\n6. Circuit Breaker Status:");
    // Circuit breaker tracks failures automatically
    // After 5 failures → opens → waits 60s → tests recovery
    console.log("Circuit breaker prevents cascading failures automatically!");
}

enterpriseFeatures();
