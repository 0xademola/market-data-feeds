import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { SportsMatch, SportsMatchSchema } from '../../normalizers';

export class OpenLigaDBAdapter extends BaseAdapter<any> {
    constructor(config: AdapterConfig = { name: 'OpenLigaDB' }) {
        super({ ...config, name: 'OpenLigaDB', rateLimitRequestPerMinute: 100 });
    }

    protected async fetchData(params: { leagueId?: string, season?: string }): Promise<SportsMatch[] | any> {
        // Case 1: League List (Available Leagues)
        if (params.leagueId === 'ALL') {
            const url = `https://api.openligadb.de/getavailableleagues`;
            const res = await this.client.get(url);

            // Filter roughly to recent years
            const currentYear = new Date().getFullYear();
            return res.data
                .filter((l: any) => l.leagueSeason >= currentYear - 1)
                .map((l: any) => ({
                    id: `${l.leagueShortcut}-${l.leagueSeason}`,
                    name: `${l.leagueName} ${l.leagueSeason}`,
                    country: 'Germany'
                }));
        }

        // Case 2: Matches for a League
        if (params.leagueId) {
            // Parse "bl1-2024" or fallback
            const [shortcut, season] = params.leagueId.includes('-')
                ? params.leagueId.split('-')
                : [params.leagueId, params.season || String(new Date().getFullYear())];

            const url = `https://api.openligadb.de/getmatchdata/${shortcut}/${season}`;
            const res = await this.client.get(url);

            if (!Array.isArray(res.data)) return [];

            return res.data.map((match: any) => {
                let status: 'SCHEDULED' | 'LIVE' | 'FINISHED' = 'SCHEDULED';
                if (match.matchIsFinished) status = 'FINISHED';
                else if (new Date(match.matchDateTime).getTime() < Date.now()) status = 'LIVE';

                const winner = this.determineWinner(match);

                return SportsMatchSchema.parse({
                    id: String(match.matchID),
                    sport: 'Football',
                    league: match.leagueName,
                    homeTeam: match.team1.teamName,
                    awayTeam: match.team2.teamName,
                    startTime: new Date(match.matchDateTime).getTime() / 1000,
                    status,
                    homeScore: match.matchResults[1]?.pointsTeam1, // Result at end of match usually index 1
                    awayScore: match.matchResults[1]?.pointsTeam2,
                    winner
                });
            });
        }

        throw new Error("OpenLigaDBAdapter: leagueId required");
    }

    private determineWinner(match: any): 'HOME' | 'AWAY' | 'DRAW' | 'PENDING' {
        if (!match.matchIsFinished) return 'PENDING';
        // OpenLigaDB results array: [0] = half time, [1] = final
        const final = match.matchResults.find((r: any) => r.resultName === "Endergebnis");
        if (!final) return 'PENDING';

        if (final.pointsTeam1 > final.pointsTeam2) return 'HOME';
        if (final.pointsTeam2 > final.pointsTeam1) return 'AWAY';
        return 'DRAW';
    }

    protected async getMockData(params: { leagueId?: string }): Promise<SportsMatch[]> {
        return [{
            id: 'oldb-12345',
            sport: 'Football',
            league: 'Bundesliga 2025',
            homeTeam: 'Bayern',
            awayTeam: 'Dortmund',
            startTime: Math.floor(Date.now() / 1000) + 7200,
            status: 'SCHEDULED',
            winner: 'PENDING'
        }];
    }
}
