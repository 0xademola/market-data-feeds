import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { EconData, EconDataSchema } from '../../normalizers';

export class FredAdapter extends BaseAdapter<EconData> {
    constructor(config: AdapterConfig = { name: 'FRED' }) {
        super({ ...config, name: 'FRED', rateLimitRequestPerMinute: 120 });
    }

    protected async fetchData(params: { seriesId: string }): Promise<EconData> {
        if (!this.config.apiKey) throw new Error("FRED API Key required");

        // FRED API: /series/observations?series_id={id}&api_key={key}&file_type=json&sort_order=desc&limit=1
        const url = `https://api.stlouisfed.org/fred/series/observations`;

        try {
            const res = await this.client.get(url, {
                params: {
                    series_id: params.seriesId,
                    api_key: this.config.apiKey,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: 1
                }
            });

            if (!res.data.observations || res.data.observations.length === 0) {
                throw new Error(`No data found for series ${params.seriesId}`);
            }

            const observation = res.data.observations[0];
            const value = parseFloat(observation.value);

            return EconDataSchema.parse({
                seriesId: params.seriesId,
                date: observation.date,
                value: isNaN(value) ? 0 : value,
                timestamp: Math.floor(Date.now() / 1000)
            });

        } catch (error: any) {
            if (error.response?.status === 400) {
                throw new Error(`FRED Error: Invalid Request or Series ID '${params.seriesId}'`);
            }
            if (error.response?.status === 403) {
                throw new Error(`FRED Error: Invalid API Key`);
            }
            throw error;
        }
    }

    protected async getMockData(params: { seriesId: string }): Promise<EconData> {
        throw new Error("Mock data disabled for Economics adapter. Please provide a valid FRED API Key.");
    }
}
