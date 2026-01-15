import { useState, useEffect } from 'react';
import { feeds } from '../Feeds';

/**
 * Hook to poll a data feed.
 * @param type 'crypto' | 'sports' | 'social'
 * @param identifier symbol, eventId, etc.
 * @param intervalMs polling interval in ms (default 10s)
 */
export function useDataFeed<T>(
    type: 'crypto' | 'sports' | 'social' | 'weather',
    identifier: string,
    intervalMs: number = 10000
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;
        let timer: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                let result;
                if (type === 'crypto') result = await feeds.crypto.price(identifier);
                else if (type === 'weather') result = await feeds.weather.current(identifier);
                else if (type === 'social') result = await feeds.social.followers(identifier);
                // Extend for others

                if (isMounted) {
                    setData(result as T);
                    setLoading(false);
                    setError(null);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err);
                    setLoading(false);
                }
            }
        };

        fetchData(); // Initial
        timer = setInterval(fetchData, intervalMs);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [type, identifier, intervalMs]);

    return { data, loading, error };
}
