import logger from '../config/logger.js';

/**
 * Weather Manager
 * Fetches weather data from the National Weather Service API
 */
class WeatherManager {
  constructor() {
    // Ellensburg, WA coordinates
    this.latitude = 46.9965;
    this.longitude = -120.5478;
    this.location = 'Ellensburg, WA';
  }

  /**
   * Get current weather forecast
   */
  async getForecast() {
    try {
      // First, get the grid point data for the coordinates
      const pointsUrl = `https://api.weather.gov/points/${this.latitude},${this.longitude}`;
      const pointsResponse = await fetch(pointsUrl, {
        headers: {
          'User-Agent': 'ChiefOfStaffApp/1.0'
        }
      });

      if (!pointsResponse.ok) {
        throw new Error(`Weather API error: ${pointsResponse.status}`);
      }

      const pointsData = await pointsResponse.json();
      const forecastUrl = pointsData.properties.forecast;

      // Get the actual forecast
      const forecastResponse = await fetch(forecastUrl, {
        headers: {
          'User-Agent': 'ChiefOfStaffApp/1.0'
        }
      });

      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status}`);
      }

      const forecastData = await forecastResponse.json();

      // Get today's forecast (first period)
      const todayForecast = forecastData.properties.periods[0];

      logger.info('Weather forecast retrieved', {
        location: this.location,
        temperature: todayForecast.temperature
      });

      return {
        location: this.location,
        temperature: todayForecast.temperature,
        temperatureUnit: todayForecast.temperatureUnit,
        shortForecast: todayForecast.shortForecast,
        detailedForecast: todayForecast.detailedForecast,
        windSpeed: todayForecast.windSpeed,
        windDirection: todayForecast.windDirection,
        icon: todayForecast.icon,
        isDaytime: todayForecast.isDaytime,
        name: todayForecast.name // e.g., "Today", "Tonight", etc.
      };
    } catch (error) {
      logger.error('Error fetching weather forecast', { error: error.message });
      throw error;
    }
  }

  /**
   * Get a simple weather string for display
   */
  async getSimpleForecast() {
    try {
      const forecast = await this.getForecast();
      return `${forecast.temperature}°${forecast.temperatureUnit} and ${forecast.shortForecast.toLowerCase()} in ${forecast.location}`;
    } catch (error) {
      logger.error('Error getting simple forecast', { error: error.message });
      return 'Weather unavailable';
    }
  }
}

// Singleton instance
const weatherManager = new WeatherManager();
export default weatherManager;
