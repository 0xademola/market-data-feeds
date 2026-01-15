import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { z } from 'zod';

export const GithubStatsSchema = z.object({
    repo: z.string(),
    stars: z.number(),
    forks: z.number(),
    issues: z.number(),
    timestamp: z.number()
});

export type GithubStats = z.infer<typeof GithubStatsSchema>;

export class GithubAdapter extends BaseAdapter<GithubStats> {
    constructor(config: AdapterConfig = { name: 'GitHub' }) {
        // High rate limit (60 unauth, 5000 auth)
        super({ ...config, name: 'GitHub', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { owner: string, repo: string }): Promise<GithubStats> {
        const url = `https://api.github.com/repos/${params.owner}/${params.repo}`;
        const headers: any = { 'User-Agent': 'Helios-SDK' };
        if (this.config.apiKey) headers['Authorization'] = `token ${this.config.apiKey}`;

        const res = await this.client.get(url, { headers });
        const data = res.data;

        return GithubStatsSchema.parse({
            repo: `${params.owner}/${params.repo}`,
            stars: data.stargazers_count,
            forks: data.forks_count,
            issues: data.open_issues_count,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    protected async getMockData(params: { owner: string, repo: string }): Promise<GithubStats> {
        return {
            repo: `${params.owner}/${params.repo}`,
            stars: 12500,
            forks: 430,
            issues: 12,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
