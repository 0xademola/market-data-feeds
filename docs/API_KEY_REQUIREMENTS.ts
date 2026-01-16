/**
 * API Key Requirements for market-data-feeds SDK
 * 
 * This document shows which data sources require API keys
 * and which ones work out-of-the-box.
 */

export const API_KEY_MATRIX = {
    // ✅ NO KEY REQUIRED (Tested & Working)
    FREE: {
        crypto: {
            adapters: ['Binance Public API', 'Chainlink On-chain'],
            tested: true,
            example: 'feeds.crypto.price("BTC")'
        },
        forex: {
            adapters: ['ExchangeRate-API Free Tier'],
            tested: true,
            example: 'feeds.forex.rate("USD", "EUR")'
        },
        random: {
            adapters: ['Drand Randomness Beacon'],
            tested: true,
            example: 'feeds.random.coinFlip()'
        },
        prediction: {
            adapters: ['Polymarket Public'],
            tested: true,
            example: 'feeds.prediction.prob("Trump")'
        },
        web: {
            adapters: ['Ping/Uptime Check'],
            tested: false,
            example: 'feeds.web.ping("https://google.com")'
        },
        calendar: {
            adapters: ['Market Hours (NYSE, NASDAQ)'],
            tested: false,
            example: 'feeds.calendar.isMarketOpen("NYSE")'
        }
    },

    // 🔑 API KEY REQUIRED
    REQUIRES_KEY: {
        sports: {
            adapters: ['SportMonks', 'TheSportsDB (paid tier)'],
            keyName: 'SPORTMONKS_KEY or SPORTS_DB_KEY',
            freeOption: 'TheSportsDB has limited free tier',
            example: 'feeds.sports.score("game_123")'
        },
        social: {
            adapters: ['YouTube Data API', 'Twitter API'],
            keyName: 'YOUTUBE_KEY, TWITTER_KEY',
            freeOption: 'YouTube has free quota (10k/day)',
            example: 'feeds.social.views("video_id")'
        },
        weather: {
            adapters: ['OpenWeather'],
            keyName: 'OPENWEATHER_KEY',
            freeOption: 'Free tier available (1k calls/day)',
            example: 'feeds.weather.current("London")'
        },
        econ: {
            adapters: ['FRED (Federal Reserve)'],
            keyName: 'FRED_API_KEY',
            freeOption: 'Free with registration',
            example: 'feeds.econ.cpi()'
        },
        ai: {
            adapters: ['OpenAI GPT'],
            keyName: 'OPENAI_KEY',
            freeOption: 'None (paid only)',
            example: 'feeds.ai.verify("Did X happen?")'
        },
        music: {
            adapters: ['Spotify'],
            keyName: 'SPOTIFY_TOKEN',
            freeOption: 'Free with OAuth',
            example: 'feeds.music.track("song_id")'
        },
        dev: {
            adapters: ['GitHub'],
            keyName: 'GITHUB_TOKEN',
            freeOption: 'Works without, but rate limited (60/hr vs 5000/hr)',
            example: 'feeds.dev.repo("facebook", "react")'
        },
        finance: {
            adapters: ['AlphaVantage / Yahoo'],
            keyName: 'FINANCE_API_KEY',
            freeOption: 'AlphaVantage free tier (25/day)',
            example: 'feeds.finance.price("AAPL")'
        },
        web: {
            adapters: ['Serper (Google Search)', 'Web Scraper'],
            keyName: 'SERPER_KEY',
            freeOption: 'Serper has free trial',
            example: 'feeds.web.search("latest news")'
        },
        onchain: {
            adapters: ['EVM RPC', 'Solana RPC'],
            keyName: 'RPC_URL (custom node or Alchemy/Infura)',
            freeOption: 'Public RPCs available but unreliable',
            example: 'feeds.onchain.read(contractAddr, abi, fn)'
        },
        agent: {
            adapters: ['AI Agent (uses OpenAI internally)'],
            keyName: 'OPENAI_KEY',
            freeOption: 'None (requires AI key)',
            example: 'feeds.agent.plan("Who won the match?")'
        }
    }
};

// Export summary
console.log("╔═══════════════════════════════════════════════════════╗");
console.log("║  API Key Requirements Summary                         ║");
console.log("╠═══════════════════════════════════════════════════════╣");
console.log("║  ✅ Works Without Keys: 6 categories                  ║");
console.log("║     - Crypto, Forex, Random, Prediction,             ║");
console.log("║       Web (ping), Calendar                            ║");
console.log("║                                                       ║");
console.log("║  🔑 Requires API Keys: 10 categories                  ║");
console.log("║     - Sports, Social, Weather, Econ, AI,             ║");
console.log("║       Music, Dev, Finance, Web (search), Agent       ║");
console.log("║                                                       ║");
console.log("║  💡 Free Tiers Available:                             ║");
console.log("║     - YouTube, Weather, FRED, GitHub, Finance         ║");
console.log("╚═══════════════════════════════════════════════════════╝");
