package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Itinerary;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.ItineraryRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripAccessService tripAccessService;

    // Get itineraries for trips accessible to the user (owned or joined)
    public List<Itinerary> getAllItineraries(String userEmail) {
        User user = getUserByEmail(userEmail);

        return itineraryRepository.findAll()
                .stream()
                .filter(itinerary -> tripAccessService.hasAccess(itinerary.getTrip(), user))
                .toList();
    }

    // Get one itinerary if user has access to its trip
    public Itinerary getItineraryById(Integer id, String userEmail) {
        Itinerary itinerary = itineraryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Itinerary not found with id: " + id));

        verifyAccess(itinerary.getTrip(), userEmail);
        return itinerary;
    }

    // Get itineraries for a trip if user has access to that trip
    public List<Itinerary> getItinerariesByTripId(Integer tripId, String userEmail) {
        Trip trip = getTripById(tripId);

        verifyAccess(trip, userEmail);
        return itineraryRepository.findByTripIdOrderByDayNumberAsc(tripId);
    }

    // Create itinerary for an accessible trip
    public Itinerary createItinerary(Integer tripId, Integer dayNumber, LocalDate dayDate, String userEmail) {
        Trip trip = getTripById(tripId);

        verifyAccess(trip, userEmail);

        Itinerary itinerary = Itinerary.builder()
                .trip(trip)
                .dayNumber(dayNumber)
                .dayDate(dayDate)
                .build();

        return itineraryRepository.save(itinerary);
    }

    // Update itinerary if user has access
    public Itinerary updateItinerary(Integer id, Integer dayNumber, LocalDate dayDate, String userEmail) {
        Itinerary itinerary = getItineraryById(id, userEmail);

        itinerary.setDayNumber(dayNumber);
        itinerary.setDayDate(dayDate);

        return itineraryRepository.save(itinerary);
    }

    // Delete itinerary if user has access
    public void deleteItinerary(Integer id, String userEmail) {
        Itinerary itinerary = getItineraryById(id, userEmail);
        itineraryRepository.delete(itinerary);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private Trip getTripById(Integer id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
    }

    private void verifyAccess(Trip trip, String userEmail) {
        User user = getUserByEmail(userEmail);
        tripAccessService.verifyAccess(trip, user);
    }
}