import { z } from 'zod';

/**
 * Data Validation Schemas
 * Runtime validation for all external API responses
 */

// ===== CRYPTO =====
export const CryptoPriceSchema = z.object({
    symbol: z.string(),
    price: z.number().positive().finite(),
    timestamp: z.number().positive(),
    source: z.string(),
    volume24h: z.number().optional()
});

export type CryptoPrice = z.infer<typeof CryptoPriceSchema>;

// ===== SPORTS =====
export const SportsFixtureSchema = z.object({
    id: z.string(),
    home: z.string().min(1),
    away: z.string().min(1),
    startTime: z.number().positive(),
    league: z.string(),
    status: z.enum(['upcoming', 'live', 'finished']).optional()
});

export const SportsScoreSchema = z.object({
    eventId: z.string(),
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
    status: z.string(),
    timestamp: z.number()
});

// ===== SOCIAL =====
export const YouTubeStatsSchema = z.object({
    videoId: z.string(),
    views: z.number().int().min(0),
    likes: z.number().int().min(0).optional(),
    timestamp: z.number()
});

export const TweetStatsSchema = z.object({
    id: z.string(),
    views: z.number().int().min(0).optional(),
    likes: z.number().int().min(0).optional(),
    retweets: z.number().int().min(0).optional(),
    timestamp: z.number()
});

// ===== WEATHER =====
export const WeatherDataSchema = z.object({
    location: z.string(),
    temperature: z.number().finite(),
    humidity: z.number().min(0).max(100).optional(),
    description: z.string(),
    timestamp: z.number()
});

// ===== FINANCE =====
export const StockPriceSchema = z.object({
    symbol: z.string(),
    price: z.number().positive().finite(),
    change: z.number().finite().optional(),
    timestamp: z.number().positive()
});

// ===== ECONOMICS =====
export const EconomicIndicatorSchema = z.object({
    indicator: z.string(),
    value: z.number().finite(),
    date: z.string(),
    timestamp: z.number()
});

// ===== AGENT/AI =====
export const AgentResultSchema = z.object({
    goal: z.string(),
    outcome: z.string(),
    confidence: z.number().min(0).max(1),
    steps: z.array(z.object({
        action: z.string(),
        result: z.string()
    })),
    timestamp: z.number()
});

// ===== PREDICTION =====
export const PredictionMarketDataSchema = z.object({
    id: z.string(),
    question: z.string(),
    probability: z.number().min(0).max(1),
    volume: z.number().min(0).optional(),
    timestamp: z.number()
});

// ===== FOREX =====
export const ForexRateSchema = z.object({
    from: z.string().length(3),
    to: z.string().length(3),
    rate: z.number().positive().finite(),
    timestamp: z.number()
});

// ===== RANDOM =====
export const RandomBeaconSchema = z.object({
    round: z.number().int().positive(),
    randomness: z.string(),
    signature: z.string(),
    timestamp: z.number()
});

/**
 * Helper function to safely validate and parse
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown, source: string): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
            throw new Error(`[${source}] Data validation failed: ${issues}`);
        }
        throw error;
    }
}
