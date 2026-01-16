import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { SocialMetrics, SocialMetricsSchema } from '../../normalizers';

/**
 * X (formerly Twitter) API Adapter
 * 
 * **IMPORTANT**: X API now requires paid subscription ($100-$42,000/month)
 * Free tier was removed in 2023.
 * 
 * Get API key: https://developer.x.com/
 * Pricing: https://developer.x.com/en/products/x-api
 * 
 * Alternatives:
 * - RapidAPI Twitter (cheaper, ~$10/month) - use RapidApiTwitterAdapter
 */
export class XAdapter extends BaseAdapter<SocialMetrics> {
    constructor(config: AdapterConfig = { name: 'X' }) {
        super({ ...config, name: 'X', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { username?: string, postId?: string, metric?: string }): Promise<SocialMetrics> {
        if (!this.config.apiKey) {
            throw new Error("X API Bearer Token required. Get one at https://developer.x.com/ ($100/month minimum)");
        }

        // Case 1: Post Metrics (Views, Likes, Reposts)
        if (params.postId) {
            const url = `https://api.twitter.com/2/tweets`;  // Note: endpoint still uses twitter.com
            const res = await this.client.get(url, {
                headers: { Authorization: `Bearer ${this.config.apiKey}` },
                params: {
                    ids: params.postId,
                    'tweet.fields': 'public_metrics'
                }
            });

            if (!res.data.data || res.data.data.length === 0) {
                throw new Error(`Post ${params.postId} not found on X`);
            }

            const metrics = res.data.data[0].public_metrics;
            const metricType = params.metric || 'views';

            let value = 0;
            if (metricType === 'views') value = metrics.impression_count || 0;
            else if (metricType === 'likes') value = metrics.like_count;
            else if (metricType === 'reposts') value = metrics.retweet_count;  // Still called retweet in API
            else if (metricType === 'replies') value = metrics.reply_count;

            return SocialMetricsSchema.parse({
                platform: 'X',  // Updated from 'TWITTER'
                entityId: params.postId,
                metric: metricType,
                value,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }

        // Case 2: User Metrics (Followers, Following)
        if (params.username) {
            const url = `https://api.twitter.com/2/users/by/username/${params.username}`;
            const res = await this.client.get(url, {
                headers: { Authorization: `Bearer ${this.config.apiKey}` },
                params: { 'user.fields': 'public_metrics' }
            });

            if (!res.data.data) {
                throw new Error(`X user @${params.username} not found`);
            }

            const metrics = res.data.data.public_metrics;
            const metricType = params.metric || 'followers';

            let value = 0;
            if (metricType === 'followers') value = metrics.followers_count;
            else if (metricType === 'following') value = metrics.following_count;
            else if (metricType === 'posts') value = metrics.tweet_count;  // Still called tweet_count in API

            return SocialMetricsSchema.parse({
                platform: 'X',
                entityId: params.username,
                metric: metricType,
                value,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }

        throw new Error("XAdapter: Either username or postId must be provided");
    }

    protected async getMockData(params: { username?: string, postId?: string, metric?: string }): Promise<SocialMetrics> {
        return {
            platform: 'X',
            entityId: params.username || params.postId || 'unknown',
            metric: params.metric || (params.postId ? 'views' : 'followers'),
            value: 5000 + Math.floor(Math.random() * 100),
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
