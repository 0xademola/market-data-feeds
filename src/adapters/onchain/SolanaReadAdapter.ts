import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { z } from 'zod';

export const SolanaAccountSchema = z.object({
    address: z.string(),
    lamports: z.number(),
    owner: z.string(),
    executable: z.boolean(),
    timestamp: z.number()
});

export type SolanaAccount = z.infer<typeof SolanaAccountSchema>;

export class SolanaReadAdapter extends BaseAdapter<SolanaAccount> {
    constructor(config: AdapterConfig = { name: 'Solana' }) {
        super({ ...config, name: 'Solana' });
    }

    protected async fetchData(params: { address: string }): Promise<SolanaAccount> {
        const rpcUrl = this.config.apiKey || 'https://api.mainnet-beta.solana.com';

        const payload = {
            jsonrpc: "2.0",
            id: 1,
            method: "getAccountInfo",
            params: [
                params.address,
                { encoding: "jsonParsed" }
            ]
        };

        const res = await this.client.post(rpcUrl, payload);

        // v1.3.1: Null safety check
        if (!res.data || res.data.error) {
            throw new Error(res.data?.error?.message || "Solana RPC Error");
        }
        if (!res.data.result || !res.data.result.value) {
            throw new Error(`Account not found or invalid address: ${params.address}`);
        }

        const val = res.data.result.value;

        return SolanaAccountSchema.parse({
            address: params.address,
            lamports: val.lamports,
            owner: val.owner,
            executable: val.executable,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    protected async getMockData(params: { address: string }): Promise<SolanaAccount> {
        return {
            address: params.address,
            lamports: 1000000000, // 1 SOL
            owner: "11111111111111111111111111111111",
            executable: false,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
