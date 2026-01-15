import { CryptoFeeds } from './adapters/crypto';
import { TheSportsDBAdapter } from './adapters/sports/TheSportsDBAdapter';
import { YouTubeAdapter } from './adapters/social/YouTubeAdapter';
import { PollingService } from './services/PollingService';
import { WebSocketService } from './services/WebSocketService';
import { RecipeDistiller } from './distillers';
import { OracleSigner } from './validators/OracleSigner';

import { Validator } from './validators';
import { Aggregator } from './aggregators';

class SportsFacade {
    private db: TheSportsDBAdapter;

    constructor(apiKey?: string) {
        this.db = new TheSportsDBAdapter({ name: 'TheSportsDB', apiKey });
    }

    async score(eventId: string) {
        return this.db.getData({ eventId });
    }

    async table(leagueId: string, season?: string) {
        return this.db.getData({ leagueId, season });
    }
}

import { TwitterAdapter } from './adapters/social/TwitterAdapter';

class SocialFacade {
    private youtube: YouTubeAdapter;
    private twitter: TwitterAdapter;

    constructor(apiKey?: string, twitterKey?: string) {
        this.youtube = new YouTubeAdapter({ name: 'YouTube', apiKey });
        this.twitter = new TwitterAdapter({ name: 'Twitter', apiKey: twitterKey });
    }

    async views(videoId: string) {
        return this.youtube.getData({ videoId, metric: 'views' });
    }

    async channelMeanViews(channelId: string) {
        return this.youtube.getData({ channelId, metric: 'mean_views' });
    }

    async followers(username: string) {
        return this.twitter.getData({ username, metric: 'followers' });
    }

    async tweet(tweetId: string, metric: 'views' | 'likes' | 'retweets' = 'views') {
        return this.twitter.getData({ tweetId, metric });
    }
}

import { SemanticOracleAdapter } from './adapters/ai/SemanticOracleAdapter'; // Stub

class AIFacade {
    private oracle: SemanticOracleAdapter;
    constructor(apiKey?: string) {
        this.oracle = new SemanticOracleAdapter({ name: 'AI', apiKey });
    }

    async verify(question: string) {
        return this.oracle.getData({ question });
    }
}

class CryptoFacade {
    private aggregator = new CryptoFeeds(); // No API key needed for basic mock/public feeds usually, or we add later

    async price(symbol: string, timestamp?: number) {
        return this.aggregator.getPrice(symbol, timestamp);
    }
}

import { EVMReadAdapter } from './adapters/onchain/EVMReadAdapter';
import { FredAdapter } from './adapters/econ/FredAdapter';

class OnChainFacade {
    private adapter: EVMReadAdapter;

    constructor(rpcUrl?: string) {
        this.adapter = new EVMReadAdapter({ name: 'EVM', apiKey: rpcUrl });
    }

    /**
     * Read from a smart contract
     * @param abi Human readable ABI, e.g. ["function latestAnswer() view returns (int256)"]
     */
    async read(address: string, abi: string[], functionName: string, args?: any[]) {
        return this.adapter.getData({ address, abi, functionName, args });
    }
}

import { OpenWeatherAdapter } from './adapters/weather/OpenWeatherAdapter';

class WeatherFacade {
    private adapter: OpenWeatherAdapter;

    constructor(apiKey?: string) {
        this.adapter = new OpenWeatherAdapter({ name: 'OpenWeather', apiKey });
    }

    async current(location: string) {
        return this.adapter.getData({ location });
    }
}

// --- Facades ---

class EconFacade {
    private fred: FredAdapter;
    constructor(apiKey?: string) {
        this.fred = new FredAdapter({ name: 'FRED', apiKey });
    }

    async series(seriesId: string) {
        return this.fred.getData({ seriesId });
    }

    // Shortcuts
    async cpi() { return this.series('CPIAUCSL'); }
    async gdp() { return this.series('GDP'); }
    async unemployment() { return this.series('UNRATE'); }
    async interestRate() { return this.series('FEDFUNDS'); }
}

import { PolymarketAdapter } from './adapters/prediction/PolymarketAdapter';

class PredictionFacade {
    private poly: PolymarketAdapter;
    constructor() {
        this.poly = new PolymarketAdapter(); // Public API usually ok without key for basic read
    }

    async prob(question: string) {
        return this.poly.getData({ question });
    }

    async market(id: string) {
        return this.poly.getData({ marketId: id });
    }
}

export interface FeedConfig {
    youtubeApiKey?: string;
    twitterApiKey?: string;
    sportsDbKey?: string;
    openWeatherKey?: string;
    evmRpcUrl?: string;
    fredApiKey?: string;
    privateKey?: string;
    openAiKey?: string;
}

export class HeliosFeeds {
    public crypto = new CryptoFacade();
    public sports = new SportsFacade();
    public social = new SocialFacade();
    public weather = new WeatherFacade(); // New
    public onchain = new OnChainFacade();
    public econ = new EconFacade();
    public prediction = new PredictionFacade();
    public ai = new AIFacade(); // New in v1.2

    // Runtime Plugin System
    private customAdapters = new Map<string, any>();

    register(name: string, adapter: any) {
        this.customAdapters.set(name, adapter);
    }

    get(name: string) {
        return this.customAdapters.get(name);
    }

    // Services
    public polling = new PollingService();
    public ws = new WebSocketService();
    public validator = Validator;
    public aggregator = Aggregator;
    public recipe = RecipeDistiller;
    public signer?: OracleSigner; // Optional signer

    /**
     * Set global API keys for all adapters
     */
    configure(config: FeedConfig) {
        if (config.sportsDbKey) this.sports = new SportsFacade(config.sportsDbKey);
        if (config.youtubeApiKey || config.twitterApiKey) {
            this.social = new SocialFacade(config.youtubeApiKey, config.twitterApiKey);
        }
        if (config.openWeatherKey) this.weather = new WeatherFacade(config.openWeatherKey);
        if (config.evmRpcUrl) this.onchain = new OnChainFacade(config.evmRpcUrl);
        if (config.fredApiKey) this.econ = new EconFacade(config.fredApiKey);
        if (config.openAiKey) this.ai = new AIFacade(config.openAiKey);

        if (config.privateKey) {
            this.signer = new OracleSigner(config.privateKey as `0x${string}`);
        }
    }

    /**
     * Helper to poll any data source
     */
    poll(
        fn: () => Promise<any>,
        intervalMs: number,
        callback: (data: any) => void
    ) {
        const id = Math.random().toString(36).substring(7);
        this.polling.start(id, fn, { interval: intervalMs });
        this.polling.on('data', (e) => {
            if (e.id === id) callback(e.data);
        });
        return id; // Return ID to stop later
    }
}

// Default export for "plug and play" usage
export const feeds = new HeliosFeeds();
