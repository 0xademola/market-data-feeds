
import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { CryptoData } from '../../normalizers';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';

// Minimal Chainlink Aggregator V3 Interface
const CHAINLINK_ABI = parseAbi([
    'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    'function decimals() view returns (uint8)'
]);

// Common Feed Addresses (Mainnet)
const FEEDS: Record<string, `0x${string}`> = {
    'BTC': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', // BTC / USD
    'ETH': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH / USD
    'SOL': '0x4ffc43a60e009b551865a93d232e33fce9f01507', // SOL / USD
    'LINK': '0x2c1d072e956affc0d435cb7ac38ef18d24d9127c', // LINK / USD
    'USDC': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6' // USDC / USD
};

export class ChainlinkAdapter extends BaseAdapter<CryptoData> {
    private publicClient;

    constructor(config: AdapterConfig & { rpcUrl?: string } = { name: 'Chainlink' }) {
        super({ ...config, name: 'Chainlink' });
        this.publicClient = createPublicClient({
            chain: mainnet,
            transport: http(config.rpcUrl) // usage of public rpc if not provided
        });
    }

    protected async fetchData(params: { symbol: string }): Promise<CryptoData> {
        const symbol = params.symbol.toUpperCase();
        const feedAddress = FEEDS[symbol];

        if (!feedAddress) {
            throw new Error(`No Chainlink Feed found for symbol: ${symbol}`);
        }

        // Parallel fetch of decimals and latest data
        const [latestRound, decimals] = await Promise.all([
            this.publicClient.readContract({
                address: feedAddress,
                abi: CHAINLINK_ABI,
                functionName: 'latestRoundData'
            }),
            this.publicClient.readContract({
                address: feedAddress,
                abi: CHAINLINK_ABI,
                functionName: 'decimals'
            })
        ]);

        const price = Number(latestRound[1]) / Math.pow(10, decimals);

        return {
            asset: symbol,
            base: 'USD',
            price: price,
            timestamp: Number(latestRound[3]) * 1000,
            source: 'chainlink'
        };
    }

    protected async getMockData(params: { symbol: string }): Promise<CryptoData> {
        return {
            asset: params.symbol,
            base: 'USD',
            price: 50000.00,
            timestamp: Date.now(),
            source: 'chainlink_mock'
        };
    }
}
