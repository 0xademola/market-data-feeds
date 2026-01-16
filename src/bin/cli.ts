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

import * as readline from 'readline';

async function interactiveMode() {
    console.log("Welcome to MarketFeeds Interactive CLI! (Type 'exit' to quit)");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

    while (true) {
        const line = await ask("\nfeeds> ");
        if (line.trim() === 'exit') break;
        if (!line.trim()) continue;

        const [cat, method, ...args] = line.trim().split(' ');
        if (!cat || !method) {
            console.warn("Usage: <category> <method> [args...]");
            continue;
        }

        try {
            await runCommand(cat, method, args, { json: false, table: true, consensus: false });
        } catch (e: any) {
            console.error(e.message);
        }
    }
    rl.close();
}

async function runCommand(category: string, method: string, args: string[], flags: any) {
    let data;
    const strategy = flags.consensus ? AggregationStrategy.CONSENSUS : AggregationStrategy.MEDIAN;

    // --- MAPPING ---
    if (category === 'crypto' && method === 'price') data = await feeds.crypto.price(args[0]);
    else if (category === 'sports' && method === 'fixtures') data = await feeds.sports.fixtures({ leagueId: args[0], sport: 'football' }, strategy);
    else if (category === 'social' && method === 'tweet') data = await feeds.social.tweet(args[0], args[1] as any);
    else if (category === 'social' && method === 'youtube') data = await feeds.social.views(args[0]);
    else if (category === 'weather' && method === 'current') data = await feeds.weather.current(args[0]);
    else if (category === 'econ' && method === 'cpi') data = await feeds.econ.cpi();
    else if (category === 'finance' && method === 'price') data = await feeds.finance.price(args[0]);
    else if (category === 'agent' && method === 'plan') data = await feeds.agent.plan(args.join(' ')); // Join args for prompt
    else if (category === 'web' && method === 'ping') data = await feeds.web.ping(args[0]);

    // --- PROOF (Merkle) ---
    else if (category === 'proof') {
        if (method === 'create') {
            // Expects JSON string or list of items
            const items = JSON.parse(args[0]);
            data = feeds.proof.createTree(items);
        } else if (method === 'verify') {
            // Usage: proof verify <item_json> <proof_json> <root>
            const item = JSON.parse(args[0]);
            const proof = JSON.parse(args[1]);
            const root = args[2] as `0x${string}`;
            const isValid = feeds.proof.verify(item, proof, root);
            data = { valid: isValid, root };
        }
    }

    else {
        throw new Error(`Unknown command: ${category} ${method}`);
    }

    if (flags.table) {
        console.table(Array.isArray(data) ? data : [data]);
    } else if (flags.json) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log(data);
    }
}

async function main() {
    // Configuration
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
        githubToken: process.env.GITHUB_TOKEN,
        financeApiKey: process.env.FINANCE_API_KEY
    });

    if (command === 'interactive' || !command) {
        await interactiveMode();
        return;
    }

    const flags = {
        consensus: hasFlag('--consensus'),
        json: hasFlag('--json'),
        table: hasFlag('--table'),
        watch: hasFlag('--watch')
    };

    if (command === 'diagnose') {
        // ... (Keep existing diagnose logic if needed or refactor, simplifying for now to focus on main interactive)
        console.log("🏥 Diagnostics not fully mapped in V3 CLI refactor yet.");
        return;
    }

    const method = args[1];
    const cmdArgs = args.slice(2).filter(a => !a.startsWith('--'));

    if (flags.watch) {
        console.clear();
        await runCommand(command, method, cmdArgs, flags);
        setInterval(async () => {
            console.clear();
            console.log(`Last updated: ${new Date().toISOString()}`);
            await runCommand(command, method, cmdArgs, flags);
        }, 5000);
    } else {
        await runCommand(command, method, cmdArgs, flags);
    }
}

main();
