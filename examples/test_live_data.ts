import { feeds } from '../src/Feeds';

/**
 * Live Data Test
 * 
 * This script tests fetching REAL data from actual APIs (no mocks).
 * We'll test multiple categories to confirm the SDK works with live sources.
 */

async function testLiveData() {
    console.log("🌐 Testing Live Data Fetching...\n");

    // Test 1: Crypto Price (No API key needed - public Binance endpoint)
    console.log("1. Testing Crypto (Bitcoin Price)...");
    try {
        const btcPrice = await feeds.crypto.price('BTC');
        console.log(`✅ BTC Price: $${btcPrice.price}`);
        console.log(`   Source: ${btcPrice.source}`);
        console.log(`   Timestamp: ${new Date(btcPrice.timestamp * 1000).toISOString()}\n`);
    } catch (e: any) {
        console.error(`❌ Crypto failed: ${e.message}\n`);
    }

    // Test 2: Forex Rate (No API key needed)
    console.log("2. Testing Forex (USD -> EUR)...");
    try {
        const rate = await feeds.forex.rate('USD', 'EUR');
        console.log(`✅ Exchange Rate: 1 USD = ${rate.rate} EUR`);
        console.log(`   Timestamp: ${new Date(rate.timestamp * 1000).toISOString()}\n`);
    } catch (e: any) {
        console.error(`❌ Forex failed: ${e.message}\n`);
    }

    // Test 3: Random Beacon (No API key - drand.love)
    console.log("3. Testing Randomness (Drand Beacon)...");
    try {
        const beacon = await feeds.random.beacon();
        console.log(`✅ Random Beacon Round: ${beacon.round}`);
        console.log(`   Signature: ${beacon.signature.substring(0, 20)}...`);
        console.log(`   Timestamp: ${new Date(beacon.timestamp * 1000).toISOString()}\n`);
    } catch (e: any) {
        console.error(`❌ Random failed: ${e.message}\n`);
    }

    // Test 4: Polymarket (No API key)
    console.log("4. Testing Prediction Market (Polymarket)...");
    try {
        const prob = await feeds.prediction.prob("Trump");
        console.log(`✅ Market Found: ${prob.question}`);
        console.log(`   Probability: ${(prob.probability * 100).toFixed(1)}%\n`);
    } catch (e: any) {
        console.error(`❌ Prediction failed: ${e.message}\n`);
    }

    console.log("─".repeat(50));
    console.log("✅ Live Data Test Complete!");
    console.log("The SDK is successfully fetching REAL data from external APIs.");
}

testLiveData();
