import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { SearchResult, SearchResultSchema } from '../../normalizers';

export class SerperAdapter extends BaseAdapter<SearchResult> {
    constructor(config: AdapterConfig = { name: 'Serper' }) {
        super({ ...config, name: 'Serper', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { query: string }): Promise<SearchResult> {
        if (!this.config.apiKey) throw new Error("Serper API Key required");

        const url = 'https://google.serper.dev/search';
        const res = await this.client.post(url, {
            q: params.query
        }, {
            headers: {
                'X-API-KEY': this.config.apiKey,
                'Content-Type': 'application/json'
            }
        });

        const organic = res.data.organic || [];
        const results = organic.slice(0, 5).map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            date: item.date
        }));

        return SearchResultSchema.parse({
            query: params.query,
            results,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    protected async getMockData(params: { query: string }): Promise<SearchResult> {
        return {
            query: params.query,
            results: [
                {
                    title: `Mock Result for ${params.query}`,
                    link: 'https://example.com/news',
                    snippet: `This is a simulated search result for the query "${params.query}". It confirms that the event happened.`,
                    date: '1 day ago'
                },
                {
                    title: 'Another Related Link',
                    link: 'https://example.org/article',
                    snippet: 'More context about the topic found here.'
                }
            ],
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
