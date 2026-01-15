import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { SportsMatch, SportsMatchSchema } from '../../normalizers';

export class TheSportsDBAdapter extends BaseAdapter<any> {
    constructor(config: AdapterConfig = { name: 'TheSportsDB' }) {
        super({ ...config, name: 'TheSportsDB', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { eventId?: string, leagueId?: string, season?: string }): Promise<SportsMatch | any> {

        // Case 1: League Table (Standings)
        if (params.leagueId) {
            // /lookuptable.php?l={leagueId}&s={season}
            const season = params.season || '2025-2026';
            const url = `https://www.thesportsdb.com/api/v1/json/${this.config.apiKey || '3'}/lookuptable.php`;
            const res = await this.client.get(url, { params: { l: params.leagueId, s: season } });

            if (!res.data.table) throw new Error(`Table not found for League ${params.leagueId} Season ${season}`);

            return {
                leagueId: params.leagueId,
                season: season,
                standings: res.data.table.map((t: any) => ({
                    teamId: t.idTeam,
                    teamName: t.strTeam,
                    rank: parseInt(t.intRank),
                    points: parseInt(t.intPoints),
                    played: parseInt(t.intPlayed),
                    goalsDiff: parseInt(t.intGoalDifference)
                }))
            };
        }

        // Case 2: Event Lookup
        if (!params.eventId) throw new Error("TheSportsDB adapter requires eventId or leagueId");

        // TheSportsDB API: /lookupevent.php?id={id}
        const url = `https://www.thesportsdb.com/api/v1/json/${this.config.apiKey || '3'}/lookupevent.php`;
        const res = await this.client.get(url, { params: { id: params.eventId } });

        if (!res.data.events || res.data.events.length === 0) throw new Error(`Event ${params.eventId} not found`);
        const event = res.data.events[0];

        // Map status
        let status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELED' = 'SCHEDULED';
        if (event.strStatus === 'Match Finished') status = 'FINISHED';
        else if (event.strStatus === 'Not Started') status = 'SCHEDULED';
        else status = 'LIVE'; // Simplified

        const data: SportsMatch = {
            id: event.idEvent,
            sport: event.strSport,
            league: event.strLeague,
            homeTeam: event.strHomeTeam,
            awayTeam: event.strAwayTeam,
            startTime: new Date(event.dateEvent + 'T' + event.strTime).getTime() / 1000,
            status,
            homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : undefined,
            awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : undefined,
            winner: 'PENDING'
        };

        if (status === 'FINISHED' && data.homeScore !== undefined && data.awayScore !== undefined) {
            if (data.homeScore > data.awayScore) data.winner = 'HOME';
            else if (data.awayScore > data.homeScore) data.winner = 'AWAY';
            else data.winner = 'DRAW';
        }

        return SportsMatchSchema.parse(data);
    }

    protected async getMockData(params: { eventId: string }): Promise<SportsMatch> {
        return {
            id: params.eventId,
            sport: 'Soccer',
            league: 'EPL',
            homeTeam: 'Arsenal',
            awayTeam: 'Man Utd',
            startTime: Math.floor(Date.now() / 1000) - 7200,
            status: 'FINISHED',
            homeScore: 3,
            awayScore: 1,
            winner: 'HOME'
        };
    }
}
