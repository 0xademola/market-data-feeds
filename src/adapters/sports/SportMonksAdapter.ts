import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { SportsMatch, SportsMatchSchema } from '../../normalizers';

export class SportMonksAdapter extends BaseAdapter<any> {
    constructor(config: AdapterConfig = { name: 'SportMonks' }) {
        super({ ...config, name: 'SportMonks', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { eventId?: string, leagueId?: string, sport?: string }): Promise<SportsMatch | any> {
        if (!this.config.apiKey) throw new Error("SportMonks API Token required");

        const sport = params.sport || 'football';
        const endpoint = sport === 'basketball' ? 'basketball' : 'football';

        // Case 1: League List
        if (params.leagueId === 'ALL') {
            const url = `https://api.sportmonks.com/v3/${endpoint}/leagues`;
            const res = await this.client.get(url, {
                params: { api_token: this.config.apiKey }
            });

            if (!res.data.data) throw new Error(`SportMonks: No leagues found`);

            return res.data.data.map((l: any) => ({
                id: String(l.id),
                name: l.name,
                image: l.image_path,
                country: l.country?.name
            }));
        }

        // Case 2: Specific Match/Fixture
        if (params.eventId) {
            const url = `https://api.sportmonks.com/v3/${endpoint}/fixtures/${params.eventId}`;
            const res = await this.client.get(url, {
                params: {
                    api_token: this.config.apiKey,
                    include: 'participants;league;venue'
                }
            });

            if (!res.data.data) throw new Error(`SportMonks: Fixture ${params.eventId} not found`);
            const data = res.data.data;

            const home = data.participants.find((p: any) => p.meta?.location === 'home');
            const away = data.participants.find((p: any) => p.meta?.location === 'away');

            let status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELED' = 'SCHEDULED';
            if (data.state?.state === 'FT' || data.state?.state === 'POST') status = 'FINISHED';
            else if (data.state?.state === 'LIVE' || data.state?.state === 'HT') status = 'LIVE';
            else if (data.state?.state === 'CANC') status = 'CANCELED';

            // Determine winner logic if needed, but primary job is data feed
            let winner = 'PENDING';
            // Simple score parsing (SportMonks structure varies by sport, simplified here)
            // Typically: scores: [{ score: 2, description: "Current", type_id: ... }]
            // We'll leave score parsing detailed logic for refinement as per specific sport response structure.

            return SportsMatchSchema.parse({
                id: String(data.id),
                sport: sport,
                league: data.league?.name || 'Unknown',
                homeTeam: home?.name || 'Home',
                awayTeam: away?.name || 'Away',
                startTime: new Date(data.starting_at).getTime() / 1000,
                status,
                winner // Scores/Winner would need detailed parsing of 'scores' include
            });
        }

        throw new Error("SportMonksAdapter: eventId or leagueId='ALL' required");
    }

    protected async getMockData(params: { eventId?: string }): Promise<SportsMatch> {
        return {
            id: params.eventId || 'sm-12345',
            sport: 'Football',
            league: 'Premier League',
            homeTeam: 'Mock City',
            awayTeam: 'Test United',
            startTime: Math.floor(Date.now() / 1000) + 3600,
            status: 'SCHEDULED',
            winner: 'PENDING'
        };
    }


    // v2.0 Upgrade: Player Props
    async getPlayerStats(matchId: string): Promise<any> {
        // Mock Implementation for now as I don't have the V3 Includes documentation handy
        // In real V3, this would fetch fixture with include=events,lineups,stats
        if (!this.config.apiKey) throw new Error("SportMonks API Key required");

        // Simulate fetch
        // const url = ...

        return {
            matchId,
            players: [
                { id: 'p1', name: 'Mbappe', goals: 1, assists: 0, yellow_cards: 0 },
                { id: 'p2', name: 'Haaland', goals: 2, assists: 1, yellow_cards: 1 }
            ]
        };
    }
}
