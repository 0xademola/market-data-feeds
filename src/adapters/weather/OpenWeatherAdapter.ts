import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { WeatherData, WeatherSchema } from '../../normalizers';

export class OpenWeatherAdapter extends BaseAdapter<WeatherData> {
    constructor(config: AdapterConfig = { name: 'OpenWeather' }) {
        super({ ...config, name: 'OpenWeather', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { location: string }): Promise<WeatherData> {
        if (!this.config.apiKey) throw new Error("OpenWeather API Key required");

        // https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={API key}
        const url = `https://api.openweathermap.org/data/2.5/weather`;
        const res = await this.client.get(url, {
            params: {
                q: params.location,
                units: 'metric',
                appid: this.config.apiKey
            }
        });

        if (!res.data || res.data.cod !== 200) throw new Error(`Weather data not found for ${params.location}`);
        const data = res.data;

        const weather: WeatherData = {
            location: data.name,
            temperature: data.main.temp,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            precip: data.rain ? data.rain['1h'] : 0,
            timestamp: data.dt // Unix timestamp from API
        };

        return WeatherSchema.parse(weather);
    }

    protected async getMockData(params: { location: string }): Promise<WeatherData> {
        return {
            location: params.location,
            temperature: 22.5 + Math.random() * 5,
            humidity: 45,
            windSpeed: 3.2,
            precip: 0,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
