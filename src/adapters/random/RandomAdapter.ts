import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { RandomData, RandomDataSchema } from '../../normalizers';

export class RandomAdapter extends BaseAdapter<RandomData> {
    constructor(config: AdapterConfig = { name: 'DrandRandom' }) {
        super({ ...config, name: 'DrandRandom', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { round?: number }): Promise<RandomData> {
        // Drand Public API (League of Entropy)
        // https://drand.love/developer/http-api/
        const roundStr = params.round ? params.round.toString() : 'latest';
        const url = `https://api.drand.sh/public/${roundStr}`;

        const res = await this.client.get(url);
        const data = res.data;

        if (!data.randomness || !data.signature) {
            throw new Error("Drand: Invalid response structure");
        }

        return RandomDataSchema.parse({
            round: Number(data.round),
            randomness: data.randomness,
            signature: data.signature,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    protected async getMockData(params: { round?: number }): Promise<RandomData> {
        return {
            round: params.round || 123456,
            randomness: "a1b2c3d4e5f6...",
            signature: "sig-mock-123...",
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
