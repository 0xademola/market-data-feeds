import { CryptoFeeds } from './adapters/crypto';
import { TheSportsDBAdapter } from './adapters/sports/TheSportsDBAdapter';
import { SportMonksAdapter } from './adapters/sports/SportMonksAdapter';
import { OpenLigaDBAdapter } from './adapters/sports/OpenLigaDBAdapter';

import { YouTubeAdapter } from './adapters/social/YouTubeAdapter';
import { TwitterAdapter } from './adapters/social/TwitterAdapter';
import { XAdapter } from './adapters/social/XAdapter';
import { RapidApiTwitterAdapter } from './adapters/social/RapidApiTwitterAdapter';

import { PollingService } from './services/PollingService';
import { WebSocketService } from './services/WebSocketService';
import { RecipeDistiller } from './distillers';
import { OracleSigner } from './validators/OracleSigner';
import { Validator } from './validators';
import { Aggregator, MultiSourceAggregator, AggregationStrategy } from './aggregators';

// v1.1+
import { EVMReadAdapter } from './adapters/onchain/EVMReadAdapter';
import { FredAdapter } from './adapters/econ/FredAdapter';
import { OpenWeatherAdapter } from './adapters/weather/OpenWeatherAdapter';
import { PolymarketAdapter } from './adapters/prediction/PolymarketAdapter';
import { KalshiAdapter } from './adapters/prediction/KalshiAdapter';
import { ManifoldAdapter } from './adapters/prediction/ManifoldAdapter';

// v1.2+
import { SemanticOracleAdapter } from './adapters/ai/SemanticOracleAdapter';

// v1.3+
import { SpotifyAdapter } from './adapters/music/SpotifyAdapter';
import { GithubAdapter } from './adapters/dev/GithubAdapter';
import { SolanaReadAdapter } from './adapters/onchain/SolanaReadAdapter';
import { ReclaimService } from './services/ReclaimService';
import { MerkleService } from './services/MerkleService';
import { PushService } from './services/PushService';
// v2.0+
import { ExchangeRateAdapter } from './adapters/forex/ExchangeRateAdapter';
import { PingAdapter } from './adapters/web/PingAdapter';
import { RandomAdapter } from './adapters/random/RandomAdapter';
import { MarketHoursAdapter } from './adapters/calendar/MarketHoursAdapter';
import { SerperAdapter } from './adapters/web/SerperAdapter';
import { ScraperAdapter } from './adapters/web/ScraperAdapter';
import { FinanceAdapter } from './adapters/finance/FinanceAdapter';
import { AgentAdapter } from './adapters/agent/AgentAdapter';
import { VisionAdapter } from './adapters/agent/VisionAdapter';
import { deepSort } from './utils/JsonUtils';
import { LLMManager, OpenAIProvider, AnthropicProvider, GeminiProvider, GroqProvider } from './adapters/ai/LLMProvider';

// --- Facades ---

class SportsFacade {
    private db: TheSportsDBAdapter;
    private monk: SportMonksAdapter;
    private openliga: OpenLigaDBAdapter;
    private aggregator: MultiSourceAggregator;

    constructor(apiKey?: string, sportMonksKey?: string) {
        this.db = new TheSportsDBAdapter({ name: 'TheSportsDB', apiKey });
        this.monk = new SportMonksAdapter({ name: 'SportMonks', apiKey: sportMonksKey });
        this.openliga = new OpenLigaDBAdapter({ name: 'OpenLigaDB' });

        this.aggregator = new MultiSourceAggregator([this.db, this.monk, this.openliga]);
    }

    // Direct Access
    async score(eventId: string) { return this.db.getData({ eventId }); }
    async table(leagueId: string, season?: string) { return this.db.getData({ leagueId, season }); }

    // Aggregated / Redundant Access
    async fixtures(params: { sport?: string, leagueId?: string, season?: string }, strategy: AggregationStrategy = AggregationStrategy.CONSENSUS) {
        try {
            return await this.aggregator.aggregate(params, strategy);
        } catch (e) {
            // Fallback to single source if aggregator completely fails or strictly one source needed
            console.warn("Aggregation failed, trying fallback to TheSportsDB");
            return this.db.getData(params);
        }
    }
}

class SocialFacade {
    private youtube: YouTubeAdapter;
    private twitter: TwitterAdapter;
    private rapidTwitter: RapidApiTwitterAdapter;
    private aggregator: MultiSourceAggregator;

    constructor(apiKey?: string, twitterKey?: string, rapidKey?: string) {
        this.youtube = new YouTubeAdapter({ name: 'YouTube', apiKey });
        this.twitter = new TwitterAdapter({ name: 'Twitter', apiKey: twitterKey });
        this.rapidTwitter = new RapidApiTwitterAdapter({ name: 'RapidTwitter', apiKey: rapidKey });

        // Aggregator for X data
        this.aggregator = new MultiSourceAggregator([this.twitter, this.rapidTwitter]);
    }

    async views(videoId: string) { return this.youtube.getData({ videoId, metric: 'views' }); }
    async channelMeanViews(channelId: string) { return this.youtube.getData({ channelId, metric: 'mean_views' }); }
    async followers(username: string) { return this.twitter.getData({ username, metric: 'followers' }); }

    // Aggregated Tweet Metrics
    async tweet(tweetId: string, metric: 'views' | 'likes' | 'retweets' = 'views') {
        return this.aggregator.aggregate({ tweetId, metric }, AggregationStrategy.CONSENSUS);
    }
}

class CryptoFacade {
    private aggregator: CryptoFeeds;
    constructor(rpcUrl?: string) {
        this.aggregator = new CryptoFeeds(rpcUrl);
    }
    async price(symbol: string, timestamp?: number) { return this.aggregator.getPrice(symbol, timestamp); }
    async pricesBatch(symbols: string[]) { return this.aggregator.getPricesBatch(symbols); }
}

class OnChainFacade {
    private evm: EVMReadAdapter;
    private solana: SolanaReadAdapter;
    constructor(evmUrl?: string, solanaUrl?: string) {
        this.evm = new EVMReadAdapter({ name: 'EVM', apiKey: evmUrl });
        this.solana = new SolanaReadAdapter({ name: 'Solana', apiKey: solanaUrl });
    }
    async read(address: string, abi: string[], functionName: string, args?: any[]) { return this.evm.getData({ address, abi, functionName, args }); }
    async getSolanaAccount(address: string) { return this.solana.getData({ address }); }
}

class WeatherFacade {
    private adapter: OpenWeatherAdapter;

    constructor(apiKey?: string) {
        this.adapter = new OpenWeatherAdapter({ name: 'OpenWeather', apiKey });
    }

    async current(location: string) {
        try {
            return await this.adapter.getData({ location });
        } catch (err: any) {
            console.warn(`[Weather] Primary failed for ${location}: ${err.message}. Using fallback...`);

            // Fallback: Use mock mode for basic data
            const mockAdapter = new OpenWeatherAdapter({ name: 'OpenWeather-Fallback', useMocks: true });
            return await mockAdapter.getData({ location });
        }
    }
}

class EconFacade {
    private fred: FredAdapter;
    constructor(apiKey?: string) {
        this.fred = new FredAdapter({ name: 'FRED', apiKey });
    }
    async series(seriesId: string) { return this.fred.getData({ seriesId }); }
    // Shortcuts
    async cpi() { return this.series('CPIAUCSL'); }
    async gdp() { return this.series('GDP'); }
    async unemployment() { return this.series('UNRATE'); }
    async interestRate() { return this.series('FEDFUNDS'); }
}

class PredictionFacade {
    private poly: PolymarketAdapter;
    private kalshi: KalshiAdapter;
    private manifold: ManifoldAdapter;

    constructor() {
        this.poly = new PolymarketAdapter();
        this.kalshi = new KalshiAdapter();
        this.manifold = new ManifoldAdapter();
    }

    // Legacy Polymarket (different schema)
    async prob(question: string) { return this.poly.getData({ question }); }
    async market(id: string) { return this.poly.getData({ marketId: id }); }

    // New: Real-time odds (v2.4.0)
    async kalshiOdds(marketId: string) { return this.kalshi.getData({ marketId }); }
    async polymarketOdds(marketId: string) { return this.poly.getData({ marketId }); }
    async manifoldOdds(marketId: string) { return this.manifold.getData({ marketId }); }

    // Cross-platform comparison for arbitrage
    async compareOdds(marketIds: { kalshi?: string, polymarket?: string, manifold?: string }) {
        const promises = [];
        if (marketIds.kalshi) promises.push(this.kalshiOdds(marketIds.kalshi));
        if (marketIds.polymarket) promises.push(this.polymarketOdds(marketIds.polymarket));
        if (marketIds.manifold) promises.push(this.manifoldOdds(marketIds.manifold));

        const results = await Promise.allSettled(promises);
        return results
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<any>).value);
    }
}

export class AIFacade {
    private oracle: SemanticOracleAdapter;
    private llmManager: LLMManager;

    constructor(config?: {
        openAiKey?: string;
        anthropicKey?: string;
        geminiKey?: string;
        groqKey?: string;
        provider?: string;
        fallbackChain?: string[];
    }) {
        // Initialize LLM Manager
        this.llmManager = new LLMManager();

        // Add available providers
        if (config?.openAiKey) {
            this.llmManager.addProvider('openai', new OpenAIProvider(config.openAiKey));
        }
        if (config?.anthropicKey) {
            this.llmManager.addProvider('anthropic', new AnthropicProvider(config.anthropicKey));
        }
        if (config?.geminiKey) {
            this.llmManager.addProvider('gemini', new GeminiProvider(config.geminiKey));
        }
        if (config?.groqKey) {
            this.llmManager.addProvider('groq', new GroqProvider(config.groqKey));
        }

        // Set fallback chain (default: openai → gemini → anthropic)
        const fallbackChain = config?.fallbackChain || ['openai', 'gemini', 'anthropic', 'groq'];
        this.llmManager.setFallbackChain(fallbackChain);

        // Create oracle with LLM manager
        this.oracle = new SemanticOracleAdapter({
            name: 'AI',
            llmManager: this.llmManager,
            provider: config?.provider
        });
    }

    async verify(question: string, context?: string) {
        return this.oracle.getData({ question, context });
    }
}

class MusicFacade {
    private spotify: SpotifyAdapter;
    constructor(apiKey?: string) { this.spotify = new SpotifyAdapter({ name: 'Spotify', apiKey }); }
    async track(id: string) { return this.spotify.getData({ type: 'track', id }); }
    async artist(id: string) { return this.spotify.getData({ type: 'artist', id }); }
}

class DevFacade {
    private github: GithubAdapter;
    constructor(apiKey?: string) { this.github = new GithubAdapter({ name: 'GitHub', apiKey }); }
    async repo(owner: string, repo: string) { return this.github.getData({ owner, repo }); }
}

class ForexFacade {
    private forex: ExchangeRateAdapter;
    constructor() { this.forex = new ExchangeRateAdapter(); }
    async rate(base: string, target: string) { return this.forex.getData({ base, target }); }
}

class WebFacade {
    private pinger: PingAdapter;
    private searcher: SerperAdapter;
    private scraper: ScraperAdapter;

    constructor(searchKey?: string) {
        this.pinger = new PingAdapter();
        this.searcher = new SerperAdapter({ name: 'Serper', apiKey: searchKey });
        this.scraper = new ScraperAdapter();
    }
    async ping(url: string) { return this.pinger.getData({ url }); }
    async search(query: string) { return this.searcher.getData({ query }); }
    async extract(url: string, schema: string) { return this.scraper.getData({ url, schema }); }
}

class RandomFacade {
    private drand: RandomAdapter;
    constructor() { this.drand = new RandomAdapter(); }
    async coinFlip() {
        const data = await this.drand.getData({ round: 0 }); // 0 = latest
        // Simple deterministic derivation from signature
        const isHeads = parseInt(data.signature.slice(-1), 16) % 2 === 0;
        return { outcome: isHeads ? 'HEADS' : 'TAILS', proof: data.signature };
    }
    async beacon() { return this.drand.getData({ round: 0 }); }
}

class CalendarFacade {
    private hours: MarketHoursAdapter;
    constructor() { this.hours = new MarketHoursAdapter(); }
    async isMarketOpen(market: string) { return this.hours.getData({ market }); }
}

class FinanceFacade {
    private adapter: FinanceAdapter;
    constructor(apiKey?: string) { this.adapter = new FinanceAdapter({ name: 'Finance', apiKey }); }
    async price(symbol: string) { return this.adapter.getData({ symbol }); }
}

class AgentFacade {
    private agent: AgentAdapter;
    private vision: VisionAdapter;
    constructor(apiKey?: string) {
        this.agent = new AgentAdapter({ name: 'Agent', apiKey });
        this.vision = new VisionAdapter({ name: 'Vision', apiKey });
    }
    async plan(goal: string) { return this.agent.getData({ goal }); }
    async see(imageUrl: string, query: string) { return this.vision.getData({ imageUrl, query }); }
}

export interface FeedConfig {
    youtubeApiKey?: string;
    twitterApiKey?: string;
    rapidTwitterKey?: string;
    sportsDbKey?: string;
    sportMonksKey?: string;
    openWeatherKey?: string;
    evmRpcUrl?: string;
    fredApiKey?: string;
    privateKey?: string;
    openAiKey?: string;
    anthropicKey?: string;
    geminiKey?: string;
    groqKey?: string;
    llmProvider?: 'openai' | 'anthropic' | 'gemini' | 'groq';
    llmFallbackChain?: string[];
    spotifyToken?: string;
    githubToken?: string;
    solanaRpcUrl?: string;
    financeApiKey?: string;
}

export class MarketFeeds {
    public crypto = new CryptoFacade();
    public sports = new SportsFacade();
    public social = new SocialFacade();
    public weather = new WeatherFacade();
    public onchain = new OnChainFacade();
    public econ = new EconFacade();
    public prediction = new PredictionFacade();
    public ai = new AIFacade();
    public music = new MusicFacade();
    public dev = new DevFacade();

    // v2.0
    public forex = new ForexFacade();
    public web = new WebFacade();
    public random = new RandomFacade();
    public calendar = new CalendarFacade();
    // v3.0
    public finance = new FinanceFacade();
    public agent = new AgentFacade();

    // Services
    public polling = new PollingService();
    public ws = new WebSocketService();
    // Use an instance or class for services without state? Reclaim is instance. Push is class.
    public proof = new MerkleService();
    // Legacy support or fallback if needed
    public reclaim = new ReclaimService();
    // Push service needs config, so we instantiate it later or user instantiates it
    public PushService = PushService;

    public validator = Validator;
    public aggregator = Aggregator;
    public recipe = RecipeDistiller;
    public signer?: OracleSigner;

    // Runtime Plugin System
    private customAdapters = new Map<string, any>();

    register(name: string, adapter: any) { this.customAdapters.set(name, adapter); }
    get(name: string) { return this.customAdapters.get(name); }

    /**
     * Sign arbitrary data with the configured Oracle Private Key.
     * Useful for creating signed feed payloads.
     */
    async signData(data: object): Promise<string> {
        if (!this.signer) throw new Error("No private key configured for signing");
        // Encode data deterministically using deepSort
        const sorted = deepSort(data);
        const payload = JSON.stringify(sorted);
        // We use signMessage from viem which signs the hash of the payload
        // OracleSigner expects `0x${string}` for dataEncoded. 
        // We need to convert our string to bytes or hash it first.
        // Let's assume OracleSigner takes hex strings.
        // For simplicity in this mock/MVP, we'll just throw if not implemented correctly or refactor OracleSigner.
        // Let's actually use a helper: string -> hex
        const hex = "0x" + Buffer.from(payload).toString('hex');
        return this.signer.signData(hex as `0x${string}`);
    }

    configure(config: FeedConfig) {
        if (config.sportsDbKey || config.sportMonksKey) {
            this.sports = new SportsFacade(config.sportsDbKey, config.sportMonksKey);
        }
        if (config.youtubeApiKey || config.twitterApiKey || config.rapidTwitterKey) {
            this.social = new SocialFacade(config.youtubeApiKey, config.twitterApiKey, config.rapidTwitterKey);
        }
        if (config.openWeatherKey) this.weather = new WeatherFacade(config.openWeatherKey);
        if (config.evmRpcUrl || config.solanaRpcUrl) {
            this.onchain = new OnChainFacade(config.evmRpcUrl, config.solanaRpcUrl);
            // Also configure CryptoFacade with EVM RPC for Chainlink
            if (config.evmRpcUrl) this.crypto = new CryptoFacade(config.evmRpcUrl);
        }
        if (config.fredApiKey) this.econ = new EconFacade(config.fredApiKey);
        if (config.openAiKey || config.anthropicKey || config.geminiKey || config.groqKey) {
            this.ai = new AIFacade({
                openAiKey: config.openAiKey,
                anthropicKey: config.anthropicKey,
                geminiKey: config.geminiKey,
                groqKey: config.groqKey,
                provider: config.llmProvider,
                fallbackChain: config.llmFallbackChain
            });
        }
        if (config.spotifyToken) this.music = new MusicFacade(config.spotifyToken);
        if (config.spotifyToken) this.music = new MusicFacade(config.spotifyToken);
        if (config.githubToken) this.dev = new DevFacade(config.githubToken);
        if (config.financeApiKey) this.finance = new FinanceFacade(config.financeApiKey);

        if (config.privateKey) {
            this.signer = new OracleSigner(config.privateKey as `0x${string}`);
        }
    }

    poll(fn: () => Promise<any>, intervalMs: number, callback: (data: any) => void) {
        const id = Math.random().toString(36).substring(7);
        this.polling.start(id, fn, { interval: intervalMs });
        this.polling.on('data', (e) => {
            if (e.id === id) callback(e.data);
        });
        return id;
    }
}

export const feeds = new MarketFeeds();
