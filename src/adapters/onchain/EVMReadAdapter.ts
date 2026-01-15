import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { EVMData, EVMDataSchema } from '../../normalizers';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';

export class EVMReadAdapter extends BaseAdapter<EVMData> {


    constructor(config: AdapterConfig = { name: 'EVM' }) {
        super({ ...config, name: 'EVM', rateLimitRequestPerMinute: 300 });
        // Default to Mainnet, can be configured
        this.client = createPublicClient({
            chain: mainnet,
            transport: http(config.apiKey) // Use apiKey as RPC URL if provided
        });
    }

    protected async fetchData(params: { address: string, abi: string[], functionName: string, args?: any[] }): Promise<EVMData> {
        const block = await this.client.getBlock();

        const result = await this.client.readContract({
            address: params.address as `0x${string}`,
            abi: parseAbi(params.abi),
            functionName: params.functionName,
            args: params.args || []
        });

        const data: EVMData = {
            network: 'mainnet',
            address: params.address,
            functionName: params.functionName,
            args: params.args,
            value: result,
            blockNumber: Number(block.number),
            timestamp: Number(block.timestamp)
        };

        return EVMDataSchema.parse(data);
    }

    protected async getMockData(params: { functionName: string }): Promise<EVMData> {
        return {
            network: 'mock_net',
            address: '0x0000000000000000000000000000000000000000',
            functionName: params.functionName,
            value: 1000000n, // BigInt mock
            blockNumber: 1234567,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
