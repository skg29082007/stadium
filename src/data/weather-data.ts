/**
 * Mock Weather Data for New York/New Jersey
 */

export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number;
  windSpeed: number; // km/h
  condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'hot';
  icon: string;
  description: string;
  uvIndex: number;
  visibility: number; // km
  severity: number; // 0-100 weather risk
}

const weatherScenarios: WeatherData[] = [
  {
    temperature: 28, feelsLike: 31, humidity: 55, windSpeed: 12,
    condition: 'clear', icon: '☀️', description: 'Clear skies, warm',
    uvIndex: 7, visibility: 15, severity: 15,
  },
  {
    temperature: 32, feelsLike: 37, humidity: 70, windSpeed: 8,
    condition: 'hot', icon: '🌡️', description: 'Hot & humid — Heat advisory',
    uvIndex: 9, visibility: 12, severity: 55,
  },
  {
    temperature: 24, feelsLike: 24, humidity: 65, windSpeed: 18,
    condition: 'cloudy', icon: '⛅', description: 'Partly cloudy, mild breeze',
    uvIndex: 4, visibility: 10, severity: 10,
  },
  {
    temperature: 22, feelsLike: 20, humidity: 80, windSpeed: 25,
    condition: 'rain', icon: '🌧️', description: 'Light rain expected',
    uvIndex: 2, visibility: 6, severity: 35,
  },
  {
    temperature: 26, feelsLike: 26, humidity: 85, windSpeed: 40,
    condition: 'storm', icon: '⛈️', description: 'Thunderstorm warning',
    uvIndex: 1, visibility: 3, severity: 85,
  },
];

let currentScenarioIndex = 0;

export function getCurrentWeather(): WeatherData {
  return weatherScenarios[currentScenarioIndex];
}

export function setWeatherScenario(index: number): void {
  currentScenarioIndex = Math.max(0, Math.min(index, weatherScenarios.length - 1));
}

export function getWeatherScenarios(): WeatherData[] {
  return [...weatherScenarios];
}

export function cycleWeather(): WeatherData {
  currentScenarioIndex = (currentScenarioIndex + 1) % weatherScenarios.length;
  return weatherScenarios[currentScenarioIndex];
}
