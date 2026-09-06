package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.WeatherDto;
import com.tripnest.tripnest_backend.entity.Destination;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeatherService {

    private static class WeatherCacheEntry {
        final WeatherDto dto;
        final long timestamp;

        WeatherCacheEntry(WeatherDto dto) {
            this.dto = dto;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > 15 * 60 * 1000; // 15 minutes TTL
        }
    }

    private final Map<String, WeatherCacheEntry> weatherCache = new ConcurrentHashMap<>();

    @Value("${weather.api.key:04d42417aeabfed7094507cb8d41a120}")
    private String apiKey;

    @Value("${weather.api.url:https://api.openweathermap.org/data/2.5/weather}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public WeatherDto getWeatherForDestination(Destination destination) {
        return getWeatherByCityName(destination.getName(), destination.getWeatherInfo());
    }

    public WeatherDto getWeatherByCityName(String cityName, String fallbackWeather) {
        if (cityName == null || cityName.isBlank()) {
            return new WeatherDto(
                    cityName,
                    24.0,
                    fallbackWeather != null ? fallbackWeather : "Sunny",
                    12.0,
                    60,
                    "☀️",
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
            );
        }

        String cacheKey = cityName.trim().toLowerCase();
        WeatherCacheEntry cached = weatherCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.dto;
        }
        WeatherDto dto = null;

        // Step 1: Try OpenWeather API if valid key
        if (apiKey != null && !apiKey.startsWith("04d42417")) {
            try {
                String url = apiUrl + "?q=" + cityName + "&units=metric&appid=" + apiKey;
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);

                if (response != null && response.containsKey("main")) {
                    Map<?, ?> main = (Map<?, ?>) response.get("main");
                    Double temp = Math.round(((Number) main.get("temp")).doubleValue() * 10.0) / 10.0;
                    Integer humidity = ((Number) main.get("humidity")).intValue();

                    Map<?, ?> wind = (Map<?, ?>) response.get("wind");
                    Double windSpeedMs = wind != null && wind.containsKey("speed")
                            ? ((Number) wind.get("speed")).doubleValue() : 3.0;
                    Double windSpeedKm = Math.round(windSpeedMs * 3.6 * 10.0) / 10.0;

                    String condition = "Clear Sky";
                    String icon = "☀️";

                    if (response.containsKey("weather")) {
                        List<?> weatherList = (List<?>) response.get("weather");
                        if (!weatherList.isEmpty()) {
                            Map<?, ?> firstWeather = (Map<?, ?>) weatherList.get(0);
                            String mainCond = (String) firstWeather.get("main");
                            String desc = (String) firstWeather.get("description");
                            String iconCode = (String) firstWeather.get("icon");

                            condition = desc != null ? capitalizeWords(desc) : (mainCond != null ? mainCond : "Clear");
                            icon = mapOpenWeatherIcon(iconCode, mainCond);
                        }
                    }

                    dto = new WeatherDto(
                            cityName,
                            temp,
                            condition,
                            windSpeedKm,
                            humidity,
                            icon,
                            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                    );
                }
            } catch (Exception e) {
                // Fallback to Open-Meteo
            }
        }

        // Step 2: Fallback to Open-Meteo REST API (No Key Required, 100% Free & Accurate)
        if (dto == null) {
            try {
                String geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search?name="
                        + cityName + "&count=1&language=en&format=json";

                Map<String, Object> geocodeResponse = restTemplate.getForObject(geocodeUrl, Map.class);
                if (geocodeResponse != null && geocodeResponse.containsKey("results")) {
                    List<?> results = (List<?>) geocodeResponse.get("results");
                    if (!results.isEmpty()) {
                        Map<?, ?> first = (Map<?, ?>) results.get(0);
                        Double lat = ((Number) first.get("latitude")).doubleValue();
                        Double lon = ((Number) first.get("longitude")).doubleValue();

                        String forecastUrl = "https://api.open-meteo.com/v1/forecast?latitude="
                                + lat + "&longitude=" + lon + "&current_weather=true";

                        Map<String, Object> forecastResponse = restTemplate.getForObject(forecastUrl, Map.class);
                        if (forecastResponse != null && forecastResponse.containsKey("current_weather")) {
                            Map<?, ?> currentWeather = (Map<?, ?>) forecastResponse.get("current_weather");
                            Double temp = Math.round(((Number) currentWeather.get("temperature")).doubleValue() * 10.0) / 10.0;
                            Double windSpeed = Math.round(((Number) currentWeather.get("windspeed")).doubleValue() * 10.0) / 10.0;
                            int weatherCode = ((Number) currentWeather.get("weathercode")).intValue();

                            String condition = decodeWeatherCode(weatherCode);
                            String icon = getWeatherIcon(weatherCode);

                            dto = new WeatherDto(
                                    cityName,
                                    temp,
                                    condition,
                                    windSpeed,
                                    62,
                                    icon,
                                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                            );
                        }
                    }
                }
            } catch (Exception ex) {
                System.err.println("Open-Meteo fallback error for " + cityName + ": " + ex.getMessage());
            }
        }

        if (dto == null) {
            dto = new WeatherDto(
                    cityName,
                    24.0,
                    fallbackWeather != null ? fallbackWeather : "Sunny",
                    12.0,
                    60,
                    "☀️",
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
            );
        }

        weatherCache.put(cacheKey, new WeatherCacheEntry(dto));
        return dto;
    }

    public Map<String, Object> geocodeWorldwideCity(String query) {
        // Try Open-Meteo Geocoding
        try {
            String geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search?name="
                    + query + "&count=1&language=en&format=json";

            Map<String, Object> geocodeResponse = restTemplate.getForObject(geocodeUrl, Map.class);
            if (geocodeResponse != null && geocodeResponse.containsKey("results")) {
                List<?> results = (List<?>) geocodeResponse.get("results");
                if (!results.isEmpty()) {
                    Map<?, ?> first = (Map<?, ?>) results.get(0);
                    String name = (String) first.get("name");
                    String country = (String) first.get("country");
                    if (country == null && first.containsKey("country_code")) {
                        country = ((String) first.get("country_code")).toUpperCase();
                    }

                    Map<String, Object> map = new HashMap<>();
                    map.put("name", name != null ? name : query);
                    map.put("country", country != null ? country : "Global");
                    return map;
                }
            }
        } catch (Exception e) {
            System.err.println("Geocoding failed for " + query + ": " + e.getMessage());
        }
        return null;
    }

    private String decodeWeatherCode(int code) {
        return switch (code) {
            case 0 -> "Clear Sky";
            case 1, 2, 3 -> "Partly Cloudy";
            case 45, 48 -> "Foggy";
            case 51, 53, 55, 56, 57 -> "Drizzle";
            case 61, 63, 65, 66, 67 -> "Rainy";
            case 71, 73, 75, 77 -> "Snowy";
            case 80, 81, 82 -> "Rain Showers";
            case 95, 96, 99 -> "Thunderstorm";
            default -> "Clear";
        };
    }

    private String getWeatherIcon(int code) {
        return switch (code) {
            case 0 -> "☀️";
            case 1, 2, 3 -> "⛅";
            case 45, 48 -> "🌫️";
            case 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82 -> "🌧️";
            case 71, 73, 75, 77 -> "❄️";
            case 95, 96, 99 -> "🌩️";
            default -> "🌤️";
        };
    }

    private String mapOpenWeatherIcon(String iconCode, String mainCondition) {
        if (iconCode != null) {
            if (iconCode.startsWith("01")) return "☀️";
            if (iconCode.startsWith("02") || iconCode.startsWith("03")) return "⛅";
            if (iconCode.startsWith("04")) return "☁️";
            if (iconCode.startsWith("09") || iconCode.startsWith("10")) return "🌧️";
            if (iconCode.startsWith("11")) return "🌩️";
            if (iconCode.startsWith("13")) return "❄️";
            if (iconCode.startsWith("50")) return "🌫️";
        }
        if (mainCondition != null) {
            String cond = mainCondition.toLowerCase();
            if (cond.contains("rain")) return "🌧️";
            if (cond.contains("cloud")) return "☁️";
            if (cond.contains("snow")) return "❄️";
            if (cond.contains("thunder")) return "🌩️";
        }
        return "🌤️";
    }

    private String capitalizeWords(String str) {
        if (str == null || str.isEmpty()) return str;
        String[] words = str.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0)))
                  .append(word.substring(1).toLowerCase())
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }
}
