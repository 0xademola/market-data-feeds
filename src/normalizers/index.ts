import { z } from 'zod';
import { encodeAbiParameters, parseUnits } from 'viem';

// --- CRYPTO ---
export const CryptoDataSchema = z.object({
    asset: z.string(),
    base: z.string().default('USD'),
    price: z.number(),
    timestamp: z.number(), // Unix timestamp (seconds)
    source: z.string(),
    volume24h: z.number().optional(),
    marketCap: z.number().optional()
});


export type CryptoData = z.infer<typeof CryptoDataSchema>;

// --- FINANCE (v3.0) ---
export const FinanceDataSchema = z.object({
    symbol: z.string(),
    price: z.number(),
    changePercent: z.number().optional(),
    volume: z.number().optional(),
    timestamp: z.number()
});
export type FinanceData = z.infer<typeof FinanceDataSchema>;

export function encodeCryptoData(data: CryptoData): `0x${string}` {
    const priceBigInt = parseUnits(data.price.toString(), 18); // Standard 18 decimals
    return encodeAbiParameters(
        [
            { type: 'string', name: 'asset' },
            { type: 'uint256', name: 'price' },
            { type: 'uint256', name: 'timestamp' }
        ],
        [data.asset, priceBigInt, BigInt(data.timestamp)]
    );
}

// --- ECONOMICS ---
export const EconDataSchema = z.object({
    seriesId: z.string(),
    date: z.string(), // YYYY-MM-DD
    value: z.number(),
    timestamp: z.number()
});

export type EconData = z.infer<typeof EconDataSchema>;

export function encodeEconData(data: EconData): `0x${string}` {
    return encodeAbiParameters(
        [
            { type: 'string', name: 'seriesId' },
            { type: 'string', name: 'date' },
            { type: 'int256', name: 'value' }, // Scaled if needed, but for now pure int
            { type: 'uint256', name: 'timestamp' }
        ],
        [
            data.seriesId,
            data.date,
            BigInt(Math.round(data.value * 100)), // Scale 2 decimals
            BigInt(data.timestamp)
        ]
    );
}

// --- PREDICTION MARKETS ---
export const PredictionMarketSchema = z.object({
    id: z.string(),
    question: z.string(),
    outcome: z.string(), // e.g., "Trump", "Yes"
    probability: z.number(), // 0.0 to 1.0
    volume: z.number().optional(),
    timestamp: z.number()
});
export type PredictionMarketData = z.infer<typeof PredictionMarketSchema>;

export function encodePredictionData(data: PredictionMarketData): `0x${string}` {
    return encodeAbiParameters(
        [
            { type: 'string', name: 'id' },
            { type: 'string', name: 'outcome' },
            { type: 'uint256', name: 'probability' }, // Scaled 18 decimals
            { type: 'uint256', name: 'timestamp' }
        ],
        [
            data.id,
            data.outcome,
            parseUnits(data.probability.toString(), 18),
            BigInt(data.timestamp)
        ]
    );
}

// --- NEWS / SENTIMENT ---
export const NewsSentimentSchema = z.object({
    topic: z.string(),
    sentimentScore: z.number(), // -1.0 to 1.0
    articleCount: z.number(),
    topSource: z.string(),
    timestamp: z.number()
});
export type NewsSentimentData = z.infer<typeof NewsSentimentSchema>;

// --- SPORTS ---
export const SportsMatchSchema = z.object({
    id: z.string(),
    sport: z.string(),
    league: z.string(),
    homeTeam: z.string(),
    awayTeam: z.string(),
    startTime: z.number(),
    status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELED']),
    homeScore: z.number().optional(),
    awayScore: z.number().optional(),
    winner: z.enum(['HOME', 'AWAY', 'DRAW', 'PENDING']).optional()
});

export type SportsMatch = z.infer<typeof SportsMatchSchema>;

export function encodeSportsMatch(data: SportsMatch): `0x${string}` {
    return encodeAbiParameters(
        [
            { type: 'string', name: 'id' },
            { type: 'uint8', name: 'status' }, // Enum mapping: 0=SCHEDULED...
            { type: 'uint16', name: 'homeScore' },
            { type: 'uint16', name: 'awayScore' }
        ],
        [
            data.id,
            ['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELED'].indexOf(data.status),
            data.homeScore || 0,
            data.awayScore || 0
        ]
    );
}

export const SportsLeagueSchema = z.object({
    leagueId: z.string(),
    season: z.string(),
    standings: z.array(z.object({
        teamId: z.string(),
        teamName: z.string(),
        rank: z.number(),
        points: z.number(),
        played: z.number(),
        goalsDiff: z.number()
    }))
});

export type SportsLeague = z.infer<typeof SportsLeagueSchema>;

// --- SOCIAL ---
export const SocialMetricsSchema = z.object({
    platform: z.enum(['YOUTUBE', 'TWITTER', 'TIKTOK', 'INSTAGRAM']),
    entityId: z.string(), // Video ID or Username
    metric: z.string(), // 'views', 'followers', 'likes'
    value: z.number(),
    timestamp: z.number()
});

export type SocialMetrics = z.infer<typeof SocialMetricsSchema>;

export function encodeSocialMetrics(data: SocialMetrics): `0x${string}` {
    return encodeAbiParameters(
        [
            { type: 'string', name: 'entityId' },
            { type: 'string', name: 'metric' },
            { type: 'uint256', name: 'value' },
            { type: 'uint256', name: 'timestamp' }
        ],
        [data.entityId, data.metric, BigInt(data.value), BigInt(data.timestamp)]
    );
}

// --- WEATHER ---
export const WeatherSchema = z.object({
    location: z.string(),
    temperature: z.number(), // Celsius
    humidity: z.number(),
    windSpeed: z.number(),
    precip: z.number().optional().default(0), // mm
    timestamp: z.number()
});

export type WeatherData = z.infer<typeof WeatherSchema>;

export function encodeWeather(data: WeatherData): `0x${string}` {
    return encodeAbiParameters(
        [
            { type: 'string', name: 'location' },
            { type: 'int256', name: 'temperature' }, // Scaled by 100 for decimals
            { type: 'uint256', name: 'timestamp' }
        ],
        [
            data.location,
            BigInt(Math.round(data.temperature * 100)),
            BigInt(data.timestamp)
        ]
    );
}

// --- EVM ---
export const EVMDataSchema = z.object({
    network: z.string(),
    address: z.string(),
    functionName: z.string(),
    args: z.array(z.any()).optional(),
    value: z.any(), // Decoded result
    blockNumber: z.number(),
    timestamp: z.number()
});

export type EVMData = z.infer<typeof EVMDataSchema>;

export function encodeEVMData(data: EVMData): `0x${string}` {
    return encodeAbiParameters(
        [{ type: 'string', name: 'value' }],
        [String(data.value)]
    );
}

// --- FOREX (v2.0) ---
export const ForexDataSchema = z.object({
    base: z.string(),
    target: z.string(),
    rate: z.number(),
    timestamp: z.number()
});
export type ForexData = z.infer<typeof ForexDataSchema>;

// --- RANDOMNESS (v2.0) ---
export const RandomDataSchema = z.object({
    round: z.number(),
    randomness: z.string(), // Hex string
    signature: z.string(),
    timestamp: z.number()
});
export type RandomData = z.infer<typeof RandomDataSchema>;

// --- WEB UTILS (v2.0) ---
export const PingDataSchema = z.object({
    url: z.string(),
    latency: z.number(), // ms
    status: z.number(), // 200, 404, etc.
    timestamp: z.number()
});
export type PingData = z.infer<typeof PingDataSchema>;

// --- CALENDAR (v2.0) ---
export const MarketStatusSchema = z.object({
    market: z.string(), // NYSE, NASDAQ, FOREX, CRYPTO
    status: z.enum(['OPEN', 'CLOSED', 'HALTED']),
    nextOpen: z.number().optional(), // Timestamp
    nextClose: z.number().optional(), // Timestamp
    timestamp: z.number()
});
export type MarketStatus = z.infer<typeof MarketStatusSchema>;

// --- SEARCH (v2.0) ---
export const SearchResultSchema = z.object({
    query: z.string(),
    results: z.array(z.object({
        title: z.string(),
        link: z.string(),
        snippet: z.string(),
        date: z.string().optional()
    })),
    timestamp: z.number()
});
export type SearchResult = z.infer<typeof SearchResultSchema>;


