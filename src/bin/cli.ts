#!/usr/bin/env node
import { CryptoFeeds } from '../adapters/crypto';
import { YouTubeAdapter } from '../adapters/social/YouTubeAdapter';
import { TheSportsDBAdapter } from '../adapters/sports/TheSportsDBAdapter';
import { TickerMapper } from '../utils/TickerMapper';
import { RecipeDistiller } from '../distillers';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
    if (!command) {
        console.log(`
Usage:
  data-feed crypto price <symbol> [timestamp]
  data-feed social youtube <videoId> [metric]
  data-feed social twitter <username> [metric]
  data-feed social tweet <tweetId> [metric]
  data-feed weather <location>
  data-feed onchain <address> <funcSig>
  data-feed sports match <eventId>
  data-feed sports table <leagueId> [season]
  data-feed recipe crypto <symbol> <targetVar>
        `);
        return;
    }

    try {
        if (command === 'crypto') {
            const feeds = new CryptoFeeds();
            const symbol = args[2];
            const timestamp = args[3] ? parseInt(args[3]) : undefined;
            const data = await feeds.getPrice(symbol, timestamp);
            console.log(JSON.stringify(data, null, 2));
            console.log(`ABI Encoded (Price): ${data.price}`);
        }

        if (command === 'social') {
            if (args[1] === 'youtube') {
                const adapter = new YouTubeAdapter({ name: 'YouTube', apiKey: process.env.YOUTUBE_API_KEY });
                const data = await adapter.getData({ videoId: args[2], metric: args[3] });
                console.log(JSON.stringify(data, null, 2));
            } else if (args[1] === 'twitter') {
                // Dynamic import or direct usage if imported
                const { TwitterAdapter } = await import('../adapters/social/TwitterAdapter');
                const adapter = new TwitterAdapter({ name: 'Twitter', apiKey: process.env.TWITTER_API_KEY });
                const data = await adapter.getData({ username: args[2], metric: args[3] });
                console.log(JSON.stringify(data, null, 2));
            } else if (args[1] === 'tweet') {
                const { TwitterAdapter } = await import('../adapters/social/TwitterAdapter');
                const adapter = new TwitterAdapter({ name: 'Twitter', apiKey: process.env.TWITTER_API_KEY });
                // data-feed social tweet <id> [metric]
                const data = await adapter.getData({ tweetId: args[2], metric: args[3] });
                console.log(JSON.stringify(data, null, 2));
            }
        }

        if (command === 'sports') {
            const adapter = new TheSportsDBAdapter({ name: 'SportsDB', apiKey: process.env.SPORTSDB_KEY });
            if (args[1] === 'match') {
                const data = await adapter.getData({ eventId: args[2] });
                console.log(JSON.stringify(data, null, 2));
            } else if (args[1] === 'table') {
                // data-feed sports table <leagueId> [season]
                const data = await adapter.getData({ leagueId: args[2], season: args[3] });
                console.log(JSON.stringify(data, null, 2));
            }
        }

        if (command === 'weather') {
            const { OpenWeatherAdapter } = await import('../adapters/weather/OpenWeatherAdapter');
            const adapter = new OpenWeatherAdapter({ name: 'Weather', apiKey: process.env.OPENWEATHER_KEY });
            const data = await adapter.getData({ location: args[1] });
            console.log(JSON.stringify(data, null, 2));
        }

        if (command === 'onchain') {
            const { EVMReadAdapter } = await import('../adapters/onchain/EVMReadAdapter');
            const adapter = new EVMReadAdapter({ name: 'EVM', apiKey: process.env.RPC_URL });
            // Usage: data-feed onchain <address> <funcName>
            const data = await adapter.getData({
                address: args[1],
                functionName: args[2],
                abi: ["function " + args[2] + "() view returns (uint256)"] // Simplified
            });
            console.log(JSON.stringify(data, null, 2));
        }

        if (command === 'econ') {
            const { FredAdapter } = await import('../adapters/econ/FredAdapter');
            const adapter = new FredAdapter({ name: 'FRED', apiKey: process.env.FRED_API_KEY });
            // data-feed econ <seriesId>
            const data = await adapter.getData({ seriesId: args[1] });
            console.log(JSON.stringify(data, null, 2));
        }

        if (command === 'recipe') {
            if (args[1] === 'crypto') {
                const node = RecipeDistiller.toRecipeNode('crypto', { symbol: args[2] }, args[3]);
                console.log(JSON.stringify(node, null, 2));
            }
        }

    } catch (err: any) {
        console.error("Error:", err.message);
    }
}

main();
