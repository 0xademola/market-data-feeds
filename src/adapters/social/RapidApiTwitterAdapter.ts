import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { SocialMetrics, SocialMetricsSchema } from '../../normalizers';

export interface RapidTwitterConfig extends AdapterConfig {
    host?: string; // e.g., 'twitter-api45.p.rapidapi.com' or 'twitter154.p.rapidapi.com'
}

export class RapidApiTwitterAdapter extends BaseAdapter<SocialMetrics> {
    constructor(config: RapidTwitterConfig = { name: 'RapidApiTwitter', host: 'twitter-api45.p.rapidapi.com' }) {
        super({ ...config, name: 'RapidApiTwitter', rateLimitRequestPerMinute: 30 });
    }

    protected async fetchData(params: { username?: string, tweetId?: string, metric?: string }): Promise<SocialMetrics> {
        if (!this.config.apiKey) throw new Error("RapidAPI Key required");
        const host = (this.config as RapidTwitterConfig).host || 'twitter-api45.p.rapidapi.com';

        // Case 1: Tweet Details
        if (params.tweetId) {
            const url = `https://${host}/tweet.php`; // Common endpoint pattern for these wrappers
            const res = await this.client.get(url, {
                headers: {
                    'X-RapidAPI-Key': this.config.apiKey,
                    'X-RapidAPI-Host': host
                },
                params: { id: params.tweetId }
            });

            // Normalized response handling - this varies wildly between RapidAPI providers
            // We assume a generic structure typical of 'twitter-api45' or similar
            const data = res.data;

            // Example extraction (adjust based on specific chosen provider):
            // properties: views, favorites, retweets

            const metricType = params.metric || 'views';
            let value = 0;

            if (metricType === 'views') value = data.views || 0;
            else if (metricType === 'likes') value = data.favorites || data.likes || 0;
            else if (metricType === 'retweets') value = data.retweets || 0;

            return SocialMetricsSchema.parse({
                platform: 'TWITTER',
                entityId: params.tweetId,
                metric: metricType,
                value,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }

        throw new Error("RapidApiTwitterAdapter: tweetId required (username lookup not yet implemented for this provider)");
    }

    protected async getMockData(params: { tweetId?: string, metric?: string }): Promise<SocialMetrics> {
        return {
            platform: 'TWITTER',
            entityId: params.tweetId || 'unknown',
            metric: params.metric || 'views',
            value: 12500 + Math.floor(Math.random() * 5000),
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
