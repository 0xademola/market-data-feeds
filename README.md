# Helios Data + Feed SDKs (`market-data-feeds`)

> **The Input Layer for Prediction Markets.**
> A modular, robust SDK to fetch, normalize, and validate external truth for the Helios Protocol.

Designed to work seamlessly with the `market-studio-recipe` SDK.

---

## 🏗 Architecture: The 5 Pillars

```ascii
      +-----------------------+       +-----------------------+
      |    Off-Chain APIs     |       |    On-Chain Oracles   |
      | (Binance, FRED, X...) |       | (Pyth, Chainlink...)  |
      +-----------+-----------+       +-----------+-----------+
                  |                               |
        +---------v-------------------------------v---------+
        |  Layer 1: Adapters (BaseAdapter)                  |
        |  [ Retries | Caching | Rate Limiting | Mocks ]    |
        +-------------------------+-------------------------+
                                  |
        +-------------------------v-------------------------+
        |  Layer 2: Normalization (Zod Schemas)             |
        |  [ Crypto | Sports | Social | Econ | Prediction ] |
        +-------------------------+-------------------------+
                                  |
        +-------------------------v-------------------------+
        |  Layer 3: Validation & Filtering                  |
        |  [ Quorum Checks | Outlier Removal | Staleness ]  |
        +-------------------------+-------------------------+
                                  |
        +-------------------------v-------------------------+
        |  Layer 4: Aggregation (Multi-Source Strategy)     |
        |  [ Median | Mean | Weighted | Confidence Score ]  |
        +-------------------------+-------------------------+
                                  |
                  +---------------v----------------+
                  |        Layer 5: Facade         |
                  | (HeliosFeeds / React Hooks)    |
                  +---------------+----------------+
                                  |
                  +---------------v----------------+
                  |   Helios Resolution Engine     |
                  +--------------------------------+
```

This SDK implements a strict **5-Layer Architecture** to ensure data integrity and developer resilience.

### 1. Hybrid Sources (Layer 1)
Connects to both **Off-Chain APIs** (Binance, ESPN, Polymarket, FRED) and **On-Chain Oracles** (Pyth, Chainlink).
- **Resilience**: Built-in "Intelligent Failover" and Retries. 
- **DX**: Universal `TickerMapper` ("BTC" = "bitcoin" = "BTCUSDT").
- **Mock Mode**: Deterministic fake data for testing (`useMocks: true`).

### 2. Normalization (Layer 2)
All data is converted into rigid **Zod Schemas** before it touches your app.
- **Crypto**: `{ asset, price, timestamp, source }`
- **Sports**: `{ matchId, homeScore, awayScore, status }`
- **Social**: `{ platform, metric, value }`
- **Econ**: `{ seriesId, value, date }`
- **Prediction**: `{ probability, outcome }`

### 3. Validation (Layer 3)
Quality control middleware.
- **Quorum**: `Validator.checkQuorum(sources, 3)`
- **Outliers**: `Validator.filterOutliers(prices)` (Standard Deviation check)
- **Staleness**: Reject data older than $T$ seconds.

### 4. Aggregation (Layer 4)
Combine multiple truth points (v1.1+).
- **Strategies**: Mean, Median, Weighted Mean.
- **Redundancy**: Fetch from 3 sources in parallel and take the median.

### 5. Recipe Integration (Layer 5)
The Bridge to Helios Market Studio.
- **Export**: `feeds.recipe.toRecipeNode(...)` generates a logic node for the resolution engine.

---

## 👩‍💻 Developer DX

We expose a simple, unified `feeds` facade for instant access.

### 1. Configuration
Set your API keys once at the start of your app.

```typescript
import { feeds } from 'market-data-feeds';

feeds.configure({
    youtubeApiKey: process.env.YOUTUBE_KEY,
    twitterApiKey: process.env.TWITTER_KEY,
    sportsDbKey: process.env.SPORTS_KEY,
    fredApiKey: process.env.FRED_KEY, // Economics
    openAiKey: process.env.OPENAI_KEY, // AI Resolution (v1.2+)
    evmRpcUrl: process.env.RPC_URL    // On-Chain
});
```

### 2. Simple Fetching

```typescript
// --- Crypto ---
const btc = await feeds.crypto.price("BTC");
// -> { price: 65000, timestamp: ... }

// --- Weather ---
const london = await feeds.weather.current("London");
// -> { temperature: 15.5, humidity: 82 }

// --- Social (Twitter/X) ---
const views = await feeds.social.tweet("123456789", "views");
// -> { value: 500000, metric: 'views' }

// --- Economics (FRED) ---
const cpi = await feeds.econ.cpi();
// -> { value: 315.2, date: '2025-01-01' }

// --- NEW in v1.3.0: Lifestyle, Tech & Speed 🌍 ---
// (v1.3.1 Update: Reliability Hardening included for WebSockets & Spotify)

// Music (Spotify)
const track = await feeds.music.track("11dFghVXANMlKmJXsNCbNl"); 
// -> { name: "Anti-Hero", popularity: 98, followers: ... }

// Dev (GitHub)
const repo = await feeds.dev.repo("facebook", "react");
// -> { stars: 216000, issues: 850, forks: 45000 }

// Cross-Chain (Solana)
const solAccount = await feeds.onchain.getSolanaAccount("EpQm...");
// -> { lamports: 1560000000, owner: "...", executable: false }

// ZK Proofs (Trust)
const proof = await feeds.proof.proveUrl("https://api.binance.com...", "price\":(\\d+)");
// -> { verified: true, proofId: "zk_...", provider: 'reclaim' }

// --- Prediction Markets (Polymarket) ---
const odds = await feeds.prediction.prob("Will Trump win?");
// -> { probability: 0.55, outcome: 'Yes' }

// --- NEW in v1.3.2: Redundant Sports & Social 🏟️ ---

// Sports (Aggregated: SportMonks + TheSportsDB + API-Football)
const matches = await feeds.sports.fixtures({ 
    sport: 'football',
    leagueId: 'ALL' 
}, 'MEDIAN'); // Uses Multi-Source Median logic

// Social (RapidAPI/TwitterAPI.io + Official API)
const tweets = await feeds.social.tweet("12345", "views");

// --- NEW in v1.2.0: AI Resolution 🧠 ---
// Resolves qualitative questions using LLMs
const aiRes = await feeds.ai.verify("Did Elon Musk tweet about Doge today?");
// -> { outcome: true, confidence: 0.95, reasoning: "..." }

// --- NEW in v1.2.0: Historic Analysis ⏳ ---
// Calculate mean views of a YouTube channel (last 10 videos)
const avgViews = await feeds.social.channelMeanViews("UC_x5XG1OV2P6uZZ5FSM9Ttw");
// -> { value: 154000, metric: 'mean_views' }

// --- On-Chain ---
const totalSupply = await feeds.onchain.read(
    '0xdAC17...', // USDT
    ['function totalSupply() view returns (uint256)'],
    'totalSupply'
);
```

### 3. React Hooks (v1.1)
Use data effortlessly in your frontend.

```typescript
import { useDataFeed } from 'market-data-feeds/hooks';

function BitcoinPrice() {
    const { data, loading } = useDataFeed('crypto', 'BTC');
    if (loading) return <div>Loading...</div>;
    return <div>BTC: ${data.price}</div>;
}
```

### 4. Production Hardening (Built-in)
The SDK automatically handles reliability for you:
*   **Retries**: Exponential backoff (1s, 2s, 4s) on API failures.
*   **Caching**: 30s TTL in-memory cache to save API credits.
*   **Deduplication**: Merges identical pending requests.

### 5. Time Travel (Snapshot Resolution)
For resolving markets at a specific deadline.

```typescript
const deadline = 1735689600; // Jan 1, 2025
const snapshot = await feeds.crypto.price('BTC', deadline);
// Fetches historical candle/OHLCV data automatically.
```

---

## 🛡️ Security & Reliability

1.  **API Key Safety**:
    *   **Backend/CLI**: Use Environment Variables (`process.env.KEY`). **NEVER** hardcode keys.
    *   **Frontend**: Do not expose sensitive keys. Use a backend proxy.
2.  **Real Data vs Mocks**:
    *   By default, adapters **attempt to fetch Real Data**.
    *   **Mock Mode**: Explicitly enable `useMocks: true` in `AdapterConfig` only for local testing.
3.  **Sanitization**:
    *   Errors are sanitized to prevent secret leakage in logs.

---

## 📄 License
MIT
