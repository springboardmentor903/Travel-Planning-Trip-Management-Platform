package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.TripRequest;
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripAccessService tripAccessService;

    public TripResponse createTrip(TripRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Destination destination = null;
        if (request.getDestinationId() != null) {
            destination = destinationRepository.findById(request.getDestinationId())
                    .orElseThrow(() -> new RuntimeException("Destination not found with id: " + request.getDestinationId()));
        }

        Trip trip = new Trip();
        trip.setOwner(user);
        trip.setDestination(destination);
        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            trip.setStatus(request.getStatus().toUpperCase());
        } else {
            trip.setStatus("PLANNED");
        }

        Trip savedTrip = tripRepository.save(trip);
        return mapToResponse(savedTrip);
    }

    public List<TripResponse> getMyTrips(String userEmail) {
        User user = getUserByEmail(userEmail);
        Map<Integer, Trip> tripMap = new LinkedHashMap<>();

        // 1. Owned trips
        List<Trip> owned = tripRepository.findByOwnerId(user.getId());
        for (Trip t : owned) {
            tripMap.put(t.getId(), t);
        }

        // 2. Member trips
        List<TripMember> memberships = tripMemberRepository.findByUserId(user.getId());
        for (TripMember tm : memberships) {
            Trip t = tm.getTrip();
            if (t != null) {
                tripMap.put(t.getId(), t);
            }
        }

        return tripMap.values().stream().map(this::mapToResponse).toList();
    }

    public TripResponse getTripById(Integer id, String userEmail) {
        Trip trip = getTripEntityById(id);
        User user = getUserByEmail(userEmail);

        // Reusable unified access check across modules
        tripAccessService.verifyAccess(trip, user);

        return mapToResponse(trip);
    }

    public TripResponse updateTrip(Integer id, TripRequest request, String userEmail) {
        Trip trip = getTripEntityById(id);
        User user = getUserByEmail(userEmail);

        // Reusable unified access check
        tripAccessService.verifyAccess(trip, user);

        if (request.getDestinationId() != null) {
            Destination destination = destinationRepository.findById(request.getDestinationId())
                    .orElseThrow(() -> new RuntimeException("Destination not found with id: " + request.getDestinationId()));
            trip.setDestination(destination);
        }

        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            trip.setStatus(request.getStatus().toUpperCase());
        }

        Trip updatedTrip = tripRepository.save(trip);
        return mapToResponse(updatedTrip);
    }

    public void deleteTrip(Integer id, String userEmail) {
        Trip trip = getTripEntityById(id);
        User user = getUserByEmail(userEmail);

        // Deleting the entire trip is restricted to Trip Owner or Group Admin
        tripAccessService.verifyGroupAdminOrOwner(trip, user);

        tripRepository.delete(trip);
    }

    public List<TripResponse> searchTripsByName(String name) {
        if (name == null || name.isBlank()) {
            return tripRepository.findAll().stream().map(this::mapToResponse).toList();
        }
        String query = name.toLowerCase().trim();
        return tripRepository.findAll().stream()
                .filter(t -> t.getTitle() != null && t.getTitle().toLowerCase().contains(query))
                .map(this::mapToResponse)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private Trip getTripEntityById(Integer id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
    }

    private TripResponse mapToResponse(Trip t) {
        Integer destId = t.getDestination() != null ? t.getDestination().getId() : null;
        String destName = t.getDestination() != null ? t.getDestination().getName() : null;
        String destCountry = t.getDestination() != null ? t.getDestination().getCountry() : null;

        return new TripResponse(
                t.getId(),
                t.getTitle(),
                t.getOwner().getId(),
                t.getOwner().getName(),
                destId,
                destName,
                destCountry,
                t.getStartDate(),
                t.getEndDate(),
                t.getStatus()
        );
    }
}
