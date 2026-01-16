#!/usr/bin/env node
import 'dotenv/config';
import { feeds } from '../Feeds';
import { AggregationStrategy } from '../aggregators/MultiSourceAggregator';
import * as readline from 'readline';

const args = process.argv.slice(2);
const command = args[0];

const hasFlag = (flag: string) => args.includes(flag);
const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx > -1 ? args[idx + 1] : undefined;
};

// Enhanced Help System
const HELP_TEXT = `
╔═══════════════════════════════════════════════════════════════╗
║            MarketFeeds CLI - Command Reference               ║
╠═══════════════════════════════════════════════════════════════╣

📊 FINANCE & CRYPTO
  crypto price <symbol>              - Get crypto price (BTC, ETH, etc.)
  finance price <ticker>             - Get stock price (AAPL, TSLA, etc.)
  forex rate <from> <to>             - Exchange rate (USD EUR)

⚽ SPORTS & SOCIAL  
  sports fixtures <leagueId>         - Get match fixtures
  sports score <eventId>             - Get match score
  social tweet <id> <metric>         - Tweet metrics (views, likes)
  social views <videoId>             - YouTube views

🤖 AI & AGENTS
  agent plan <goal>                  - Ask AI agent (uses OpenAI)
  agent see <imageUrl> <query>       - Vision analysis
  ai verify <question>               - Semantic verification

🌍 WORLD DATA
  weather current <city>             - Current weather
  econ cpi                           - US inflation (CPI)
  econ gdp                           - US GDP
  random coinFlip                    - Verifiable random
  prediction prob <query>            - Polymarket odds

🔐 TRUTH LAYER
  proof create '<json_array>'        - Generate Merkle tree
  proof verify '<item>' '<proof>' <root> - Verify proof
  sign <data>                        - Sign data as oracle

🔧 UTILITIES
  web ping <url>                     - Check uptime
  web search <query>                 - Search web (Serper)
  calendar isMarketOpen <market>     - Market hours (NYSE, etc.)

📋 FLAGS
  --json                             - JSON output
  --table                            - Table format (default in interactive)
  --watch                            - Continuous monitoring (5s refresh)
  --consensus                        - Use consensus aggregation

💡 EXAMPLES
  crypto price BTC --watch
  agent plan "Who won the 2024 Super Bowl?"
  proof create '[{"price": 100}, {"price": 200}]'
  
Type 'help <category>' for category details (e.g., 'help crypto')
Type 'exit' to quit interactive mode
╚═══════════════════════════════════════════════════════════════╝
`;

const CATEGORY_HELP: Record<string, string> = {
    crypto: `
🪙 CRYPTO COMMANDS
  crypto price <symbol>  - Real-time price (Binance + Chainlink)
  
  Examples:
    crypto price BTC
    crypto price ETH --watch
    `,
    finance: `
💰 FINANCE COMMANDS
  finance price <ticker> - Stock/commodity price
  
  Examples:
    finance price AAPL
    finance price TSLA
    `,
    agent: `
🤖 AGENT COMMANDS
  agent plan <goal>      - Multi-step research task
  agent see <url> <q>    - Vision analysis
  
  Examples:
    agent plan "Who is the CEO of Tesla?"
    agent see "https://img.url" "What's in this image?"
    `,
    proof: `
🔐 PROOF COMMANDS
  proof create '<array>' - Generate Merkle tree from data
  proof verify ...       - Verify inclusion proof
  
  Examples:
    proof create '[{"id":1},{"id":2}]'
    `
};

async function interactiveMode() {
    console.log("🚀 Welcome to MarketFeeds Interactive CLI!");
    console.log("Type 'help' for commands, 'exit' to quit\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '\n💭 feeds> '
    });

    rl.prompt();

    rl.on('line', async (line) => {
        const trimmed = line.trim();

        if (trimmed === 'exit' || trimmed === 'quit') {
            console.log("👋 Goodbye!");
            rl.close();
            process.exit(0);
        }

        if (!trimmed) {
            rl.prompt();
            return;
        }

        // Enhanced Help
        if (trimmed === 'help' || trimmed === 'h') {
            console.log(HELP_TEXT);
            rl.prompt();
            return;
        }

        if (trimmed.startsWith('help ')) {
            const cat = trimmed.split(' ')[1];
            console.log(CATEGORY_HELP[cat] || `No help for '${cat}'. Try: help`);
            rl.prompt();
            return;
        }

        const parts = trimmed.split(' ');
        const [cat, method, ...cmdArgs] = parts;

        if (!cat || !method) {
            console.warn("⚠️  Usage: <category> <method> [args...]");
            console.log("   Try: help");
            rl.prompt();
            return;
        }

        try {
            await runCommand(cat, method, cmdArgs, { json: false, table: true, consensus: false });
        } catch (e: any) {
            console.error(`❌ Error: ${e.message}`);
        }

        rl.prompt();
    });
}

async function runCommand(category: string, method: string, args: string[], flags: any) {
    let data;
    const strategy = flags.consensus ? AggregationStrategy.CONSENSUS : AggregationStrategy.MEDIAN;

    // CRYPTO & FINANCE
    if (category === 'crypto' && method === 'price') data = await feeds.crypto.price(args[0]);
    else if (category === 'finance' && method === 'price') data = await feeds.finance.price(args[0]);
    else if (category === 'forex' && method === 'rate') data = await feeds.forex.rate(args[0], args[1]);

    // SPORTS & SOCIAL
    else if (category === 'sports' && method === 'fixtures') data = await feeds.sports.fixtures({ leagueId: args[0], sport: 'football' }, strategy);
    else if (category === 'sports' && method === 'score') data = await feeds.sports.score(args[0]);
    else if (category === 'social' && method === 'tweet') data = await feeds.social.tweet(args[0], args[1] as any);
    else if (category === 'social' && method === 'views') data = await feeds.social.views(args[0]);

    // WEATHER & ECON
    else if (category === 'weather' && method === 'current') data = await feeds.weather.current(args[0]);
    else if (category === 'econ') {
        if (method === 'cpi') data = await feeds.econ.cpi();
        else if (method === 'gdp') data = await feeds.econ.gdp();
        else if (method === 'unemployment') data = await feeds.econ.unemployment();
    }

    // AI & AGENTS
    else if (category === 'agent' && method === 'plan') data = await feeds.agent.plan(args.join(' '));
    else if (category === 'agent' && method === 'see') data = await feeds.agent.see(args[0], args.slice(1).join(' '));
    else if (category === 'ai' && method === 'verify') data = await feeds.ai.verify(args.join(' '));

    // WEB & UTILITIES
    else if (category === 'web' && method === 'ping') data = await feeds.web.ping(args[0]);
    else if (category === 'web' && method === 'search') data = await feeds.web.search(args.join(' '));
    else if (category === 'random' && method === 'coinFlip') data = await feeds.random.coinFlip();
    else if (category === 'random' && method === 'beacon') data = await feeds.random.beacon();
    else if (category === 'prediction' && method === 'prob') data = await feeds.prediction.prob(args.join(' '));
    else if (category === 'calendar' && method === 'isMarketOpen') data = await feeds.calendar.isMarketOpen(args[0]);

    // PROOF SYSTEM
    else if (category === 'proof') {
        if (method === 'create') {
            const items = JSON.parse(args[0]);
            data = feeds.proof.createTree(items);
            console.log(`✅ Merkle Root: ${data.root}`);
            console.log(`📊 Total Leaves: ${data.leaves.length}`);
        } else if (method === 'verify') {
            const item = JSON.parse(args[0]);
            const proof = JSON.parse(args[1]);
            const root = args[2] as `0x${string}`;
            const isValid = feeds.proof.verify(item, proof, root);
            console.log(isValid ? '✅ PROOF VALID' : '❌ PROOF INVALID');
            data = { valid: isValid, root };
        }
    }

    // SIGNING
    else if (category === 'sign') {
        const payload = JSON.parse(args.join(' '));
        const sig = await feeds.signData(payload);
        console.log(`✅ Signature: ${sig}`);
        return;
    }

    else {
        throw new Error(`Unknown command: ${category} ${method}`);
    }

    // Output formatting
    if (flags.table && data) {
        console.table(Array.isArray(data) ? data : [data]);
    } else if (flags.json) {
        console.log(JSON.stringify(data, null, 2));
    } else if (data) {
        console.log(data);
    }
}

async function main() {
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
        financeApiKey: process.env.FINANCE_API_KEY,
        privateKey: process.env.ORACLE_PRIVATE_KEY
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

    const method = args[1];
    const cmdArgs = args.slice(2).filter(a => !a.startsWith('--'));

    if (flags.watch) {
        console.clear();
        await runCommand(command, method, cmdArgs, flags);
        setInterval(async () => {
            console.clear();
            console.log(`⏰ Last updated: ${new Date().toISOString()}`);
            await runCommand(command, method, cmdArgs, flags);
        }, 5000);
    } else {
        await runCommand(command, method, cmdArgs, flags);
    }
}

main();
