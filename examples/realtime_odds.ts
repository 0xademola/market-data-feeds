/**
 * Real-Time Odds Example - v2.4.0
 * 
 * Fetch live prediction market odds from multiple platforms
 * and compare for arbitrage opportunities.
 */

import { feeds } from '../src/index';

async function main() {
    console.log('=== Real-Time Prediction Market Odds (v2.4.0) ===\n');

    try {
        // 1. Get Kalshi odds
        console.log('📊 Fetching Kalshi odds...');
        const kalsh = await feeds.prediction.kalshiOdds('TRUMP-WIN-2024');
        console.log(`Platform: ${kalsh.platform}`);
        console.log(`Question: ${kalsh.question}`);
        console.log(`YES: ${kalsh.yesPrice}%`);
        console.log(`NO: ${kalsh.noPrice}%`);
        console.log();

        //2. Get Manifold odds
        console.log('📊 Fetching Manifold odds...');
        const manifold = await feeds.prediction.manifoldOdds('trump-2024');
        console.log(`Platform: ${manifold.platform}`);
        console.log(`YES: ${manifold.yesPrice}%`);
        console.log();

        // 3. Cross-platform comparison
        console.log('🔍 Cross-Platform Comparison...');
        const comparison = await feeds.prediction.compareOdds({
            kalshi: 'TRUMP-WIN-2024',
            manifold: 'trump-2024'
        });

        console.log('\nArbitrage Opportunities:');
        comparison.forEach(market => {
            console.log(`  ${market.platform}: YES at ${market.yesPrice}%`);
        });

        // Calculate spread
        if (comparison.length >= 2) {
            const prices = comparison.map(m => m.yesPrice);
            const maxPrice = Math.max(...prices);
            const minPrice = Math.min(...prices);
            const spread = maxPrice - minPrice;

            console.log(`\nSpread: ${spread.toFixed(2)}%`);
            if (spread > 5) {
                console.log('⚠️  Large spread detected - arbitrage opportunity!');
            }
        }

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

main();
