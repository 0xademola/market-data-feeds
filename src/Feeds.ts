import { CryptoFeeds } from './adapters/crypto';
import { TheSportsDBAdapter } from './adapters/sports/TheSportsDBAdapter';
import { YouTubeAdapter } from './adapters/social/YouTubeAdapter';
import { TwitterAdapter } from './adapters/social/TwitterAdapter';
import { PollingService } from './services/PollingService';
import { WebSocketService } from './services/WebSocketService';
import { RecipeDistiller } from './distillers';
import { OracleSigner } from './validators/OracleSigner';
import { Validator } from './validators';
import { Aggregator } from './aggregators';

// v1.1+
import { EVMReadAdapter } from './adapters/onchain/EVMReadAdapter';
import { FredAdapter } from './adapters/econ/FredAdapter';
import { OpenWeatherAdapter } from './adapters/weather/OpenWeatherAdapter';
import { PolymarketAdapter } from './adapters/prediction/PolymarketAdapter';

// v1.2+
import { SemanticOracleAdapter } from './adapters/ai/SemanticOracleAdapter';

// v1.3+
import { SpotifyAdapter } from './adapters/music/SpotifyAdapter';
import { GithubAdapter } from './adapters/dev/GithubAdapter';
import { SolanaReadAdapter } from './adapters/onchain/SolanaReadAdapter';
import { ReclaimService } from './services/ReclaimService';
import { PushService } from './services/PushService';

// --- Facades ---

class SportsFacade {
    private db: TheSportsDBAdapter;
    constructor(apiKey?: string) {
        this.db = new TheSportsDBAdapter({ name: 'TheSportsDB', apiKey });
    }
    async score(eventId: string) { return this.db.getData({ eventId }); }
    async table(leagueId: string, season?: string) { return this.db.getData({ leagueId, season }); }
}

class SocialFacade {
    private youtube: YouTubeAdapter;
    private twitter: TwitterAdapter;
    constructor(apiKey?: string, twitterKey?: string) {
        this.youtube = new YouTubeAdapter({ name: 'YouTube', apiKey });
        this.twitter = new TwitterAdapter({ name: 'Twitter', apiKey: twitterKey });
    }
    async views(videoId: string) { return this.youtube.getData({ videoId, metric: 'views' }); }
    async channelMeanViews(channelId: string) { return this.youtube.getData({ channelId, metric: 'mean_views' }); }
    async followers(username: string) { return this.twitter.getData({ username, metric: 'followers' }); }
    async tweet(tweetId: string, metric: 'views' | 'likes' | 'retweets' = 'views') { return this.twitter.getData({ tweetId, metric }); }
}

class CryptoFacade {
    private aggregator = new CryptoFeeds();
    async price(symbol: string, timestamp?: number) { return this.aggregator.getPrice(symbol, timestamp); }
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
    async current(location: string) { return this.adapter.getData({ location }); }
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
    constructor() { this.poly = new PolymarketAdapter(); }
    async prob(question: string) { return this.poly.getData({ question }); }
    async market(id: string) { return this.poly.getData({ marketId: id }); }
}

class AIFacade {
    private oracle: SemanticOracleAdapter;
    constructor(apiKey?: string) { this.oracle = new SemanticOracleAdapter({ name: 'AI', apiKey }); }
    async verify(question: string) { return this.oracle.getData({ question }); }
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

export interface FeedConfig {
    youtubeApiKey?: string;
    twitterApiKey?: string;
    sportsDbKey?: string;
    openWeatherKey?: string;
    evmRpcUrl?: string;
    fredApiKey?: string;
    privateKey?: string;
    openAiKey?: string;
    spotifyToken?: string;
    githubToken?: string;
    solanaRpcUrl?: string;
}

export class HeliosFeeds {
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

    // Services
    public polling = new PollingService();
    public ws = new WebSocketService();
    // Use an instance or class for services without state? Reclaim is instance. Push is class.
    public proof = new ReclaimService();
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

    configure(config: FeedConfig) {
        if (config.sportsDbKey) this.sports = new SportsFacade(config.sportsDbKey);
        if (config.youtubeApiKey || config.twitterApiKey) {
            this.social = new SocialFacade(config.youtubeApiKey, config.twitterApiKey);
        }
        if (config.openWeatherKey) this.weather = new WeatherFacade(config.openWeatherKey);
        if (config.evmRpcUrl || config.solanaRpcUrl) this.onchain = new OnChainFacade(config.evmRpcUrl, config.solanaRpcUrl);
        if (config.fredApiKey) this.econ = new EconFacade(config.fredApiKey);
        if (config.openAiKey) this.ai = new AIFacade(config.openAiKey);
        if (config.spotifyToken) this.music = new MusicFacade(config.spotifyToken);
        if (config.githubToken) this.dev = new DevFacade(config.githubToken);

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

export const feeds = new HeliosFeeds();
