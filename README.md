# Market Data Feeds SDK (v2.2.0) 🤖

> **The Truth Layer for Prediction Markets.**
> A modular, verifiable, and robust SDK to fetch, normalize, and cryptographically prove external data.

---

## 🚀 Features at a Glance

| Feature | Description |
| :--- | :--- |
| **8 Data Categories** | Crypto, Finance, Sports, Social, On-Chain, Weather, Econ, Web. |
| **The Truth Layer** | **Merkle Proofs** & **Oracle Signatures** for trustless verification. |
| **Autonomous Agents** | Delegate complex research ("Who is CEO?") to AI agents. |
| **Real-Time** | WebSocket support for sub-second crypto updates. |
| **Hardened** | Automatic retries, rate-limiting, caching, and error sanitization. |
| **Interactive CLI** | Explore data and generate proofs from your terminal. |

---

## 📦 Installation

```bash
npm install market-data-feeds
```

---

## 🔑 API Key Configuration

The SDK uses a **BYOK (Bring Your Own Key)** model - you provide your own API keys for premium features while free features work out-of-the-box.

### Quick Setup

Create a `.env` file in your project:

```bash
# Copy template
cp .env.example .env

# Add your keys
OPENAI_KEY=sk-...
SPORTMONKS_KEY=...
# ... see full list below
```

Then configure in your code:

```typescript
import { feeds } from 'market-data-feeds';

feeds.configure({
    openAiKey: process.env.OPENAI_KEY,
    sportMonksKey: process.env.SPORTMONKS_KEY,
    // ... other keys
});
```

### 📊 Feature Tier Matrix

| Category | Feature | Free? | Key Required | Cost Estimate |
|----------|---------|-------|--------------|---------------|
| 🪙 Crypto | Price, Markets | ✅ Yes | None | $0 |
| 💱 Forex | Exchange Rates | ✅ Yes | None | $0 |
| 🎲 Random | Beacon, CoinFlip | ✅ Yes | None | $0 |
| 📈 Prediction | Polymarket Odds | ✅ Yes | None | $0 |
| ⚽ Sports | Fixtures, Scores | ⚠️ Limited | `SPORTMONKS_KEY` | $69-999/mo |
| 🐦 Social | Twitter, YouTube | ⚠️ Quota | `YOUTUBE_KEY`, `TWITTER_KEY` | Free tier available |
| 🌤️ Weather | Current, Forecast | ⚠️ Quota | `OPENWEATHER_KEY` | Free: 1k/day |
| 💼 Finance | Stocks, Commodities | ⚠️ Quota | `FINANCE_API_KEY` | Free: 25/day |
| 📊 Economics | CPI, GDP | ⚠️ Quota | `FRED_API_KEY` | Free unlimited |
| 🤖 Agent | AI Research | ❌ Paid | `OPENAI_KEY` | ~$0.002/call |
| 👁️ Vision | Image Analysis | ❌ Paid | `OPENAI_KEY` | ~$0.01/image |
| 🔗 On-Chain | EVM/Solana Reads | ⚠️ Public RPC | `RPC_URL` (optional) | Free (slow) |
| 🌐 Web | Search, Scraping | ⚠️ Quota | `SERPER_KEY` | Free trial |

### 🔧 Environment Variables Reference

```bash
# ===== FREE FEATURES (No key needed) =====
# Crypto, Forex, Random, Prediction Markets work out-of-the-box

# ===== AI & AGENTS (Paid) =====
OPENAI_KEY=sk-...                    # Required for: agent.plan(), agent.see(), ai.verify()
                                     # Get key: https://platform.openai.com/api-keys
                                     # Cost: ~$0.002/request (GPT-4o-mini)

# ===== SPORTS DATA =====
SPORTMONKS_KEY=your_key              # Required for: sports.fixtures(), sports.score()
                                     # Get key: https://www.sportmonks.com/
                                     # Cost: $69-$999/month (depends on leagues)

THE_SPORTS_DB_KEY=your_key           # Alternative (limited free tier)
                                     # Get key: https://www.thesportsdb.com/api.php

# ===== SOCIAL MEDIA =====
YOUTUBE_KEY=AIza...                  # Required for: social.views()
                                     # Get key: https://console.cloud.google.com/
                                     # Free tier: 10,000 queries/day

TWITTER_BEARER_TOKEN=AAA...          # Required for: social.tweet()
                                     # Get key: https://developer.twitter.com/
                                     # Free tier: 500k tweets/month

# ===== WORLD DATA =====
OPENWEATHER_KEY=abc123               # Required for: weather.current()
                                     # Get key: https://openweathermap.org/api
                                     # Free tier: 1,000 calls/day

FRED_API_KEY=xyz789                  # Required for: econ.cpi(), econ.gdp()
                                     # Get key: https://fred.stlouisfed.org/docs/api/api_key.html
                                     # Free tier: Unlimited (requires registration)

# ===== FINANCE =====
FINANCE_API_KEY=demo                 # Required for: finance.price()
                                     # Get key: https://www.alphavantage.co/support/#api-key
                                     # Free tier: 25 calls/day

# ===== BLOCKCHAIN =====
EVM_RPC_URL=https://...              # Optional for: onchain.read()
                                     # Free options: Public RPCs (slow/unreliable)
                                     # Paid: Alchemy, Infura ($0-199/mo)

# ===== ORACLE SIGNING =====
ORACLE_PRIVATE_KEY=0x...             # Required for: feeds.signData()
                                     # Generate: Use any Ethereum wallet

# ===== OTHER =====
SERPER_KEY=...                       # Required for: web.search()
SPOTIFY_TOKEN=...                    # Required for: music.track()
GITHUB_TOKEN=...                     # Optional (increases rate limit)
```

### 💡 Best Practices

1. **Never Commit Keys**: Add `.env` to `.gitignore`
2. **Use Environment-Specific Keys**: Dev vs Prod
3. **Monitor Usage**: Most APIs have dashboards
4. **Start Free**: Test with free features first
5. **Rotate Keys**: Regularly update for security

### 📝 `.env.example` Template

Save this as `.env.example` in your repo:

```bash
# ===== ALWAYS FREE =====
# Crypto, Forex, Random - no keys needed!

# ===== OPTIONAL KEYS =====
# Sports (Required for sports data)
# SPORTMONKS_KEY=

# AI/Agent (Required for agent features)
# OPENAI_KEY=

# Social Media
# YOUTUBE_KEY=
# TWITTER_BEARER_TOKEN=

# World Data
# OPENWEATHER_KEY=
# FRED_API_KEY=

# Finance
# FINANCE_API_KEY=

# Oracle Signing
# ORACLE_PRIVATE_KEY=
```

### 🚨 Common Issues

**"Error: API key required"**
- Check if the key is set in `.env`
- Ensure `feeds.configure()` is called before using the feature
- Verify the key hasn't expired

**"Rate limit exceeded"**
- You've hit the free tier limit
- Wait for reset (usually 24 hours) or upgrade to paid tier

**"Invalid API key"**
- Double-check for typos
- Some keys need a prefix (e.g., `sk-` for OpenAI)
- Regenerate the key if it's old

---

## 🚀 Quick Startion

Configure the SDK once at the root of your application.

```typescript
import { feeds } from 'market-data-feeds';

feeds.configure({
    // --- Finance & Crypto ---
    financeApiKey: process.env.FINANCE_KEY,   // AlphaVantage/Yahoo
    evmRpcUrl: process.env.RPC_URL,           // Ethereum/Polygon
    
    // --- Sports & Social ---
    sportMonksKey: process.env.SPORTMONKS_KEY, 
    twitterApiKey: process.env.TWITTER_KEY,
    
    // --- AI & Agents ---
    openAiKey: process.env.OPENAI_KEY,        // For Agent/Vision
    
    // --- Oracle Identity ---
    privateKey: process.env.ORACLE_PRIVATE_KEY // For signing feeds
});
```

---

## 📚 Usage Guide

### 1. 💰 Finance & Real-World Assets
Fetch stock, commodity, and forex data.
```typescript
const apple = await feeds.finance.price('AAPL');
// -> { symbol: 'AAPL', price: 150.25, volume: ... }

const eurUsd = await feeds.forex.rate('EUR', 'USD');
// -> { rate: 1.08, timestamp: ... }
```

### 2. 🤖 Autonomous Agents
Delegate complex tasks to AI.
```typescript
// Research
const plan = await feeds.agent.plan("Who won the 1990 World Cup?");
// -> { goal: "...", outcome: "West Germany", confidence: 0.99 }

// Vision
const score = await feeds.agent.see('https://img.url/scoreboard.jpg', 'What is the score?');
// -> { answer: "2-1", confidence: 0.95 }
```

### 3. 🛡️ The Truth Layer (Proofs)
Generate cryptographic proofs for your data.

**A. Merkle Inclusion Proofs** (Batch Verification)
```typescript
const data = [{ price: 100 }, { price: 200 }];
const tree = feeds.proof.createTree(data);

// Generate proof for specific item
const proof = feeds.proof.getProof({ price: 100 }, tree);

// Verify (On-chain or Off-chain)
const isValid = feeds.proof.verify({ price: 100 }, proof, tree.root);
```

**B. Signed Feeds** (Oracle Identity)
```typescript
const signature = await feeds.signData({ price: 100, symbol: 'BTC' });
// -> "0xabc..." (Verifiable via ecrecover)
```

### 4. ⚽ Sports & Social
aggregated data with consensus.
```typescript
// Sports (Consensus of 3 providers)
const matches = await feeds.sports.fixtures({ leagueId: 'EPL' }, 'CONSENSUS');

// Social Metrics
const views = await feeds.social.tweet('123456789', 'views');
```

### 5. 🌍 World Data
```typescript
const weather = await feeds.weather.current('London');
const cpi = await feeds.econ.cpi(); // Inflation data
const random = await feeds.random.coinFlip(); // Verifiable Randomness (Drand)
```

---

## 📖 Full API Reference

| Facade | Method | Args | Returns |
| :--- | :--- | :--- | :--- |
| **`crypto`** | `price` | `symbol` | `{ price, volume, timestamp }` |
| **`finance`** | `price` | `symbol` | `{ price, volume, high, low }` |
| **`forex`** | `rate` | `base, target` | `{ rate, timestamp }` |
| **`sports`** | `fixtures` | `params, strategy` | `Match[]` (Aggregated) |
| | `score` | `eventId` | `{ home, away, status }` |
| **`social`** | `tweet` | `id, metric` | `{ value, metric }` |
| | `views` | `videoId` | `{ views }` |
| **`agent`** | `plan` | `goal` | `{ outcome, confidence, steps }` |
| | `see` | `url, query` | `{ answer, confidence }` |
| **`proof`** | `createTree` | `data[]` | `{ root, leaves }` |
| | `getProof` | `item, tree` | `bytes32[]` |
| **`onchain`** | `read` | `addr, abi, fn` | `Result` (EVM) |
| **`web`** | `search` | `query` | `Result[]` |

---

## 🔐 Secret Management

**How are keys stored?**
1.  **Storage**: Keys should reside in your `.env` file (e.g. `OPENAI_KEY=sk-...`).
2.  **Injection**: You pass them to `feeds.configure()` at app startup.
3.  **Memory**: The SDK moves them into **private class properties** inside each Adapter.
4.  **Retrieval**: Adapters access `this.config.apiKey` internally.

**Security Guaranteed**:
*   The SDK **never logs** your config object.
*   The SDK **scrubs** any leaked keys from error messages before throwing.

---

## 💻 Interactive CLI

The SDK includes a powerful interactive CLI for exploration and testing.

### Quick Start
```bash
# Interactive mode
npx market-data-feeds interactive

# Or install globally
npm install -g market-data-feeds
data-feed interactive
```

### Available Commands

**Finance & Crypto**
- `crypto price BTC` - Real-time crypto prices
- `finance price AAPL` - Stock prices
- `forex rate USD EUR` - Exchange rates

**Sports & Social**
- `sports fixtures EPL` - Match fixtures
- `social tweet <id> views` - Twitter metrics
- `social views <videoId>` - YouTube stats

**AI & Agents**
- `agent plan "your question"` - AI research
- `agent see <url> "query"` - Vision analysis

**World Data**
- `weather current London` - Weather data
- `econ cpi` - Economic indicators
- `random coinFlip` - Verifiable randomness
- `prediction prob "query"` - Polymarket odds

**Truth Layer**
- `proof create '[{"data":"test"}]'` - Merkle proofs
- `sign <data>` - Oracle signatures

**Utilities**
- `help` - Show all commands
- `help <category>` - Category help
- `--watch` - Live monitoring
- `--table` - Table format

---

## 🔒 Security

-   **No Leaks**: Error logs are automatically scrubbed of API keys.
-   **Determinism**: All hashing and signing operations use deep-sort serialization to prevent malleability attacks.
-   **Safety**: Rate limits are enforced with "Fail-Fast" logic to prevent hanging processes.

---

## 📄 License
MIT
