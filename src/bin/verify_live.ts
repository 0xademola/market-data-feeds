
import { feeds } from '../Feeds';
import { AggregationStrategy } from '../aggregators/MultiSourceAggregator';

async function main() {
    console.log("🚀 Starting LIVE Verification (v1.3.4)...");

    // 1. Configure with Process Environment (Simulating Prod)
    // Users must run: SPORTMONKS_KEY=... RAPID_TWITTER_KEY=... ts-node src/bin/verify_live.ts
    feeds.configure({
        sportMonksKey: process.env.SPORTMONKS_KEY,
        sportsDbKey: process.env.THE_SPORTS_DB_KEY,
        rapidTwitterKey: process.env.RAPID_TWITTER_KEY,
        twitterApiKey: process.env.TWITTER_BEARER_TOKEN,
        openWeatherKey: process.env.OPENWEATHER_KEY
    });

    console.log("\n--- Active Configuration ---");
    console.log("SportMonks Key Present:", !!process.env.SPORTMONKS_KEY);
    console.log("RapidTwitter Key Present:", !!process.env.RAPID_TWITTER_KEY);

    try {
        // Test 1: Sports Consensus (Requires Keys or falls back safely)
        console.log("\n1. Testing Sports Consensus (Football)...");
        try {
            const fixtures = await feeds.sports.fixtures({ leagueId: '8' }, AggregationStrategy.CONSENSUS); // Premier League ID varies, using generic
            console.log("✅ Sports Data Received:", fixtures ? (Array.isArray(fixtures) ? `${fixtures.length} items` : 'Object') : 'Null');
        } catch (e: any) {
            console.warn("⚠️ Sports Fetch Failed (Expected if no keys):", e.message);
        }

        // Test 2: Social Metrics
        console.log("\n2. Testing Social Metrics (Twitter)...");
        try {
            const tweet = await feeds.social.tweet('1234567890', 'views');
            console.log("✅ Tweet Data Received:", tweet);
        } catch (e: any) {
            console.warn("⚠️ Social Fetch Failed (Expected if no keys):", e.message);
        }

        // Test 3: Weather (Simple)
        console.log("\n3. Testing Weather (London)...");
        try {
            const weather = await feeds.weather.current('London');
            console.log("✅ Weather Data Received:", weather);
        } catch (e: any) {
            console.warn("⚠️ Weather Fetch Failed (Expected if no keys):", e.message);
        }

    } catch (criticalError) {
        console.error("❌ CRITICAL SCRIPT FAILURE:", criticalError);
        process.exit(1);
    }

    console.log("\n✨ Verification Script Finished. If you saw 'Data Received', you are ready for Prod.");
}

main();
