#!/usr/bin/env node
import 'dotenv/config'; // Load .env file
import { feeds } from '../Feeds';
import { AggregationStrategy } from '../aggregators/MultiSourceAggregator';

const args = process.argv.slice(2);
const command = args[0];

// Simple helper to parse --flag args
const hasFlag = (flag: string) => args.includes(flag);
const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx > -1 ? args[idx + 1] : undefined;
};

async function main() {
    // 0. Runtime Configuration 
    // .env is loaded automatically above.
    // Explicitly configure feeds (facade will also pick up process.env by default but good to be explicit for diagnose)
    feeds.configure({
        sportMonksKey: process.env.SPORTMONKS_KEY,
        sportsDbKey: process.env.THE_SPORTS_DB_KEY,
        rapidTwitterKey: process.env.RAPID_TWITTER_KEY,
        twitterApiKey: process.env.TWITTER_BEARER_TOKEN,
        openWeatherKey: process.env.OPENWEATHER_KEY,
        openAiKey: process.env.OPENAI_KEY,
        evmRpcUrl: process.env.EVM_RPC_URL,
        fredApiKey: process.env.FRED_API_KEY,
        spotifyToken: process.env.SPOTIFY_TOKEN,
        githubToken: process.env.GITHUB_TOKEN
    });

    if (!command || command === 'help') {
        console.log(`
Usage: market-data-feeds <category> <method> [args...] [flags]

Commands:
  diagnose                              ⚡ Run a smoke test on all configured adapters

Categories:
  crypto price <symbol>                 Get price (Binance/Coingecko/Chainlink)
  sports fixtures <leagueId>            Get fixtures (SportMonks/SportsDB)
  social tweet <id> <metric>            Get tweet metrics
  social youtube <videoId> [metric]     Get YouTube metrics
  weather current <location>            Get current weather
  onchain solana <address>              Get Solana account info
  econ cpi                              Get CPI data (FRED)
  prediction prob "<question>"          Get Polymarket probability
  music track <id>                      Get Spotify track info
  dev repo <owner> <repo>               Get GitHub repo stats
  ai verify "<question>"                Resolve question via LLM

Flags:
  --consensus    Use Multi-Source Consensus (Majority Vote)
  --json         Output raw JSON only
        `);
        return;
    }

    try {
        let data;
        const strategy = hasFlag('--consensus') ? AggregationStrategy.CONSENSUS : AggregationStrategy.MEDIAN;

        // --- DIAGNOSE ---
        if (command === 'diagnose') {
            console.log("🏥 Running Diagnostics on Feeds...");
            const report: any = {};

            // 1. Weather
            try {
                await feeds.weather.current('London');
                report.weather = "✅ OK";
            } catch (e: any) { report.weather = `❌ Failed: ${e.message}`; }

            // 2. Crypto
            try {
                await feeds.crypto.price('BTC');
                report.crypto = "✅ OK";
            } catch (e: any) { report.crypto = `❌ Failed: ${e.message}`; }

            // 3. AI
            if (process.env.OPENAI_KEY) {
                try {
                    await feeds.ai.verify("Is this a test?");
                    report.ai = "✅ OK";
                } catch (e: any) { report.ai = `❌ Failed: ${e.message}`; }
            } else { report.ai = "⚠️ Skipped (No Key)"; }

            console.table(report);
            return;
        }

        // --- SPORTS ---
        if (command === 'sports') {
            const leagueId = args[2] || 'ALL';
            if (args[1] === 'fixtures') {
                console.warn(`fetching fixtures for league ${leagueId} using ${hasFlag('--consensus') ? 'CONSENSUS' : 'MEDIAN'}...`);
                data = await feeds.sports.fixtures({ leagueId, sport: 'football' }, strategy);
            }
        }

        // --- SOCIAL ---
        else if (command === 'social') {
            if (args[1] === 'tweet') {
                const metric = (args[3] || 'views') as any;
                console.warn(`fetching tweet ${args[2]} ${metric}...`);
                data = await feeds.social.tweet(args[2], metric);
            } else if (args[1] === 'youtube') {
                data = await feeds.social.views(args[2]);
            }
        }

        // --- CRYPTO ---
        else if (command === 'crypto') {
            if (args[1] === 'price') {
                data = await feeds.crypto.price(args[2]);
            }
        }

        // --- ECON ---
        else if (command === 'econ') {
            if (args[1] === 'cpi') data = await feeds.econ.cpi();
            else if (args[1] === 'gdp') data = await feeds.econ.gdp();
        }

        // --- PREDICTION ---
        else if (command === 'prediction') {
            if (args[1] === 'prob') data = await feeds.prediction.prob(args[2]);
        }

        // --- MUSIC ---
        else if (command === 'music') {
            if (args[1] === 'track') data = await feeds.music.track(args[2]);
        }

        // --- DEV ---
        else if (command === 'dev') {
            if (args[1] === 'repo') data = await feeds.dev.repo(args[2], args[3]);
        }

        // --- AI ---
        else if (command === 'ai') {
            if (args[1] === 'verify') {
                const question = args.slice(2).join(' ') || "No question provided";
                console.warn(`Asking Oracle: "${question}"...`);
                data = await feeds.ai.verify(question);
            }
        }

        // --- WEATHER ---
        else if (command === 'weather') {
            data = await feeds.weather.current(args[2]);
        }

        // --- ONCHAIN ---
        else if (command === 'onchain') {
            if (args[1] === 'solana') {
                data = await feeds.onchain.getSolanaAccount(args[2]);
            }
        }

        else {
            console.error(`Unknown command: ${command}`);
            process.exit(1);
        }

        console.log(JSON.stringify(data, null, 2));

    } catch (err: any) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

main();
