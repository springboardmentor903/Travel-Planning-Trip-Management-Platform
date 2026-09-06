package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.DestinationResponse;
import com.tripnest.tripnest_backend.dto.WeatherDto;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;
    private final WeatherService weatherService;

    public List<DestinationResponse> getAllDestinations() {
        return destinationRepository.findAll().stream()
                .map(this::mapToResponseWithWeather)
                .toList();
    }

    public List<DestinationResponse> getPopularDestinations() {
        return destinationRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsPopular()))
                .map(this::mapToResponseWithWeather)
                .toList();
    }

    public DestinationResponse getDestinationById(Integer id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Destination not found with id: " + id));
        return mapToResponseWithWeather(destination);
    }

    public WeatherDto getWeatherForDestination(Integer id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Destination not found with id: " + id));
        return weatherService.getWeatherForDestination(destination);
    }

    public List<DestinationResponse> searchDestinations(String query) {
        if (query == null || query.isBlank()) {
            return getAllDestinations();
        }

        String q = query.trim();
        String qLower = q.toLowerCase();

        // Step 1: Search local DB
        List<Destination> dbMatches = destinationRepository.findAll().stream()
                .filter(d -> d.getName().toLowerCase().contains(qLower) ||
                        d.getCountry().toLowerCase().contains(qLower) ||
                        (d.getDescription() != null && d.getDescription().toLowerCase().contains(qLower)))
                .toList();

        List<DestinationResponse> results = new ArrayList<>(
                dbMatches.stream().map(this::mapToResponseWithWeather).toList()
        );

        // Step 2: If no exact DB match, query worldwide geocoding service for any place in the world
        boolean exactDbMatch = dbMatches.stream()
                .anyMatch(d -> d.getName().equalsIgnoreCase(q));

        if (!exactDbMatch) {
            Map<String, Object> placeInfo = weatherService.geocodeWorldwideCity(q);
            if (placeInfo != null && placeInfo.containsKey("name")) {
                String cityName = (String) placeInfo.get("name");
                String country = (String) placeInfo.get("country");

                String finalCityName = cityName;
                boolean exists = destinationRepository.findAll().stream()
                        .anyMatch(d -> d.getName().equalsIgnoreCase(finalCityName));

                if (!exists) {
                    WeatherDto liveWeather = weatherService.getWeatherByCityName(cityName, null);
                    String weatherStr = liveWeather.getTemperature() + "°C " + liveWeather.getCondition();

                    Destination newDest = new Destination(
                            null,
                            cityName,
                            country,
                            "Famous destination in " + country + ". Discover landmarks, check live weather, and organize your trip itinerary.",
                            weatherStr,
                            false
                    );

                    Destination saved = destinationRepository.save(newDest);
                    results.add(0, mapToResponseWithWeather(saved));
                }
            }
        }

        return results;
    }

    private DestinationResponse mapToResponseWithWeather(Destination d) {
        String liveWeatherStr = d.getWeatherInfo();
        if (liveWeatherStr == null || liveWeatherStr.isBlank()) {
            WeatherDto weather = weatherService.getWeatherForDestination(d);
            liveWeatherStr = weather.getTemperature() + "°C " + weather.getCondition();
        }

        return new DestinationResponse(
                d.getId(),
                d.getName(),
                d.getCountry(),
                d.getDescription(),
                liveWeatherStr,
                d.getIsPopular()
        );
    }
}
