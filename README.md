# Market Data Feeds SDK (v2.0.0)

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

## 🛠 Configuration

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

## 💻 CLI Experience

The SDK comes with a powerful interactive CLI for exploration and debugging.

### Start Interactive Mode
```bash
npx market-data-feeds interactive
```

### Commands
```bash
feeds> finance price TSLA --table
feeds> agent plan "Find the latest block number on Ethereum"
feeds> proof create '[{"id":1},{"id":2}]'
feeds> crypto price BTC --watch
```

---

## 🔒 Security

-   **No Leaks**: Error logs are automatically scrubbed of API keys.
-   **Determinism**: All hashing and signing operations use deep-sort serialization to prevent malleability attacks.
-   **Safety**: Rate limits are enforced with "Fail-Fast" logic to prevent hanging processes.

---

## 📄 License
MIT
