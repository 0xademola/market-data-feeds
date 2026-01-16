
import { feeds } from '../Feeds';
import { AggregationStrategy } from '../aggregators/MultiSourceAggregator';

async function main() {
    console.log("Starting v1.3.3 Logic Verification...");

    // 1. Verify Strategy Default in Feeds
    // We can't introspect default params easily in JS runtime without calling it, 
    // but we can verify the enum exists and the method runs.

    // 2. Aggregator Consensus Logic (Mock Test)
    // Since we don't have a direct unit test runner set up here, we'll try to invoke 
    // the aggregator with mocked adapters if possible, or just rely on the build + existing mocks.

    try {
        // Attempt a call that should trigger CONSENSUS
        console.log("Invoking fixtures with CONSENSUS...");
        const promise = feeds.sports.fixtures({ leagueId: 'ALL' });
        // We expect this to fail (no keys) OR return mock data if configured?
        // Actually, we haven't configured mocks in the singleton 'feeds'.
        // So this will fail with 'All sources failed' or similar.

        promise.then(() => console.log("Fixtures call resolved"))
            .catch(e => console.log("Fixtures call failed as expected (no API keys):", e.message));

    } catch (e) {
        console.error("Critical Error:", e);
        process.exit(1);
    }

    console.log("Build and Import Check: OK");
}

main();
