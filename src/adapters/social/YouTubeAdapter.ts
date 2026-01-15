import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { SocialMetrics, SocialMetricsSchema } from '../../normalizers';

export class YouTubeAdapter extends BaseAdapter<SocialMetrics> {
    constructor(config: AdapterConfig = { name: 'YouTube' }) {
        super({ ...config, name: 'YouTube', rateLimitRequestPerMinute: 100 });
    }

    protected async fetchData(params: { videoId?: string, channelId?: string, metric?: string }): Promise<SocialMetrics> {
        if (!this.config.apiKey) throw new Error("YouTube API Key required");

        const metric = params.metric || 'views';

        // Case A: Single Video
        if (params.videoId) {
            const url = `https://www.googleapis.com/youtube/v3/videos`;
            const res = await this.client.get(url, {
                params: {
                    id: params.videoId,
                    part: 'statistics',
                    key: this.config.apiKey
                }
            });

            if (!res.data.items || res.data.items.length === 0) throw new Error("Video not found");
            const stats = res.data.items[0].statistics;
            let value = 0;
            if (metric === 'views') value = parseInt(stats.viewCount);
            else if (metric === 'likes') value = parseInt(stats.likeCount);
            else if (metric === 'comments') value = parseInt(stats.commentCount);

            return SocialMetricsSchema.parse({
                platform: 'YOUTUBE',
                entityId: params.videoId,
                metric,
                value,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }

        // Case B: Channel Mean Views (Historical / Last N)
        if (params.channelId && metric === 'mean_views') {
            // 1. Get recent videos from channel (using Search API for 'date' order)
            // Note: Search API costs 100 quota units. PlaylistItems costs 1. efficient method is uploads playlist.
            // For simplicity/speed here, using Search. 
            const searchUrl = `https://www.googleapis.com/youtube/v3/search`;
            const searchRes = await this.client.get(searchUrl, {
                params: {
                    channelId: params.channelId,
                    part: 'id',
                    order: 'date', // recent first
                    type: 'video',
                    maxResults: 10,
                    key: this.config.apiKey
                }
            });

            if (!searchRes.data.items || searchRes.data.items.length === 0) throw new Error("Channel videos not found");

            const videoIds = searchRes.data.items.map((item: any) => item.id.videoId).join(',');

            // 2. Get stats for these videos
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos`;
            const statsRes = await this.client.get(statsUrl, {
                params: {
                    id: videoIds,
                    part: 'statistics',
                    key: this.config.apiKey
                }
            });

            // 3. Calculate Mean
            const items = statsRes.data.items || [];
            if (items.length === 0) return SocialMetricsSchema.parse({
                platform: 'YOUTUBE',
                entityId: params.channelId,
                metric,
                value: 0,
                timestamp: Math.floor(Date.now() / 1000)
            });

            const totalViews = items.reduce((sum: number, item: any) => sum + parseInt(item.statistics.viewCount || '0'), 0);
            const mean = Math.floor(totalViews / items.length);

            return SocialMetricsSchema.parse({
                platform: 'YOUTUBE',
                entityId: params.channelId,
                metric: 'mean_views',
                value: mean,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }

        throw new Error("Invalid parameters: provide videoId or (channelId + 'mean_views')");
    }

    protected async getMockData(params: { videoId?: string, channelId?: string, metric?: string }): Promise<SocialMetrics> {
        return {
            platform: 'YOUTUBE',
            entityId: params.videoId || params.channelId || "mock",
            metric: params.metric || 'views',
            value: params.metric === 'mean_views' ? 50000 : 1500000,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
