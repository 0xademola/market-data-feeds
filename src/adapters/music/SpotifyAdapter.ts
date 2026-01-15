import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { z } from 'zod';

export const MusicStatsSchema = z.object({
    id: z.string(),
    name: z.string(),
    popularity: z.number(), // 0-100
    followers: z.number().optional(),
    timestamp: z.number()
});

export type MusicStats = z.infer<typeof MusicStatsSchema>;

export class SpotifyAdapter extends BaseAdapter<MusicStats> {
    constructor(config: AdapterConfig = { name: 'Spotify' }) {
        super({ ...config, name: 'Spotify', rateLimitRequestPerMinute: 200 });
    }

    protected async fetchData(params: { type: 'artist' | 'track', id: string }): Promise<MusicStats> {
        if (!this.config.apiKey) throw new Error("Spotify Bearer Token required");

        const url = `https://api.spotify.com/v1/${params.type}s/${params.id}`;
        const res = await this.client.get(url, {
            headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
        });

        const data = res.data;
        return MusicStatsSchema.parse({
            id: data.id,
            name: data.name,
            popularity: data.popularity,
            followers: data.followers?.total,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    protected async getMockData(params: { type: 'artist' | 'track', id: string }): Promise<MusicStats> {
        return {
            id: params.id,
            name: "Mock Artist",
            popularity: 85,
            followers: 5000000,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
