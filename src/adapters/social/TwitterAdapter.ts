import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { SocialMetrics, SocialMetricsSchema } from '../../normalizers';

/**
 * @deprecated Twitter is now X. Use XAdapter instead.
 * This adapter will be removed in v3.0.0.
 * See: https://github.com/yourusername/market-data-feeds/blob/main/MIGRATION.md
 */
export class TwitterAdapter extends BaseAdapter<SocialMetrics> {
    constructor(config: AdapterConfig = { name: 'Twitter' }) {
        super({ ...config, name: 'Twitter', rateLimitRequestPerMinute: 60 });
        console.warn('⚠️  TwitterAdapter is deprecated. Twitter rebranded to X. Use XAdapter instead. See docs for migration.');
    }

    protected async fetchData(params: { username?: string, tweetId?: string, metric?: string }): Promise<SocialMetrics> {
        if (!this.config.apiKey) throw new Error("Twitter API Bearer Token required");

        // Case 1: Tweet Metrics (Views, Likes, Retweets)
        if (params.tweetId) {
            // /2/tweets?ids=:id&tweet.fields=public_metrics
            const url = `https://api.twitter.com/2/tweets`;
            const res = await this.client.get(url, {
                headers: { Authorization: `Bearer ${this.config.apiKey}` },
                params: {
                    ids: params.tweetId,
                    'tweet.fields': 'public_metrics'
                }
            });

            if (!res.data.data || res.data.data.length === 0) throw new Error(`Tweet ${params.tweetId} not found`);
            const metrics = res.data.data[0].public_metrics;
            const metricType = params.metric || 'views';

            let value = 0;
            if (metricType === 'views') value = metrics.impression_count || 0; // 'impression_count' is views
            else if (metricType === 'likes') value = metrics.like_count;
            else if (metricType === 'retweets') value = metrics.retweet_count;

            return SocialMetricsSchema.parse({
                platform: 'TWITTER',
                entityId: params.tweetId,
                metric: metricType,
                value,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }

        // Case 2: User Metrics (Followers, Following)
        if (params.username) {
            // Twitter API v2: /2/users/by/username/:username?user.fields=public_metrics
            const url = `https://api.twitter.com/2/users/by/username/${params.username}`;
            const res = await this.client.get(url, {
                headers: { Authorization: `Bearer ${this.config.apiKey}` },
                params: { 'user.fields': 'public_metrics' }
            });

            if (!res.data.data) throw new Error(`Twitter user ${params.username} not found`);
            const metrics = res.data.data.public_metrics;

            const metricType = params.metric || 'followers';
            let value = 0;

            if (metricType === 'followers') value = metrics.followers_count;
            else if (metricType === 'following') value = metrics.following_count;
            else if (metricType === 'tweets') value = metrics.tweet_count;

            return SocialMetricsSchema.parse({
                platform: 'TWITTER',
                entityId: params.username,
                metric: metricType,
                value,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }

        throw new Error("TwitterAdapter: Either username or tweetId must be provided");
    }

    protected async getMockData(params: { username?: string, tweetId?: string, metric?: string }): Promise<SocialMetrics> {
        return {
            platform: 'TWITTER',
            entityId: params.username || params.tweetId || 'unknown',
            metric: params.metric || (params.tweetId ? 'views' : 'followers'),
            value: 5000 + Math.floor(Math.random() * 100),
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
