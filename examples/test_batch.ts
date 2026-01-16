import { feeds } from '../src/Feeds';

/**
 * Batch Processing Demo
 * Shows performance improvement: 1 API call vs N calls
 */

async function testBatchProcessing() {
    console.log("🚀 Batch Processing Performance Test\n");

    const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI'];

    // === SEQUENTIAL (OLD WAY) ===
    console.log("📊 Sequential Fetching (10 separate API calls)...");
    const start1 = Date.now();
    const sequentialResults = [];
    for (const symbol of symbols) {
        try {
            const price = await feeds.crypto.price(symbol);
            sequentialResults.push(price);
        } catch (e: any) {
            console.warn(`  ⚠️  ${symbol}: ${e.message}`);
        }
    }
    const sequential Time = Date.now() - start1;
    console.log(`  ⏱️  Time: ${sequentialTime}ms`);
    console.log(`  ✅ Fetched: ${sequentialResults.length} prices\n`);

    // === BATCH (NEW WAY) ===
    console.log("⚡ Batch Fetching (1 API call)...");
    const start2 = Date.now();
    const batchResults = await feeds.crypto.pricesBatch(symbols);
    const batchTime = Date.now() - start2;
    console.log(`  ⏱️  Time: ${batchTime}ms`);
    console.log(`  ✅ Fetched: ${batchResults.length} prices\n`);

    // === COMPARISON ===
    const speedup = (sequentialTime / batchTime).toFixed(1);
    console.log("═".repeat(50));
    console.log(`🎯 Performance Improvement: ${speedup}x faster`);
    console.log(`💰 API Calls Saved: ${symbols.length - 1} calls`);
    console.log("═".repeat(50));

    // Show sample
    console.log("\n📋 Sample Batch Results:");
    console.table(batchResults.slice(0, 5).map(r => ({
        Symbol: r.asset,
        Price: `$${r.price.toLocaleString()}`,
        Volume24h: `$${(r.volume24h || 0).toLocaleString()}`
    })));
}

testBatchProcessing();
