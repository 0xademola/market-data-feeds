import { z } from 'zod';

// Shared schema for all prediction market odds
export const MarketOddsSchema = z.object({
    marketId: z.string(),
    platform: z.enum(['KALSHI', 'POLYMARKET', 'MANIFOLD', 'PREDICTIT']),
    question: z.string(),
    yesPrice: z.number(),   // Probability of YES (0-1 for most, 0-100 for Kalshi)
    noPrice: z.number(),    // Probability of NO
    volume24h: z.number().optional(),
    lastUpdated: z.number(),
    url: z.string().optional()
});

export type MarketOdds = z.infer<typeof MarketOddsSchema>;
