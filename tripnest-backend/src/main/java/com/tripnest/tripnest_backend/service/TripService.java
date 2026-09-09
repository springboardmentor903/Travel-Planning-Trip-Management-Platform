package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.TripRequest;
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.entity.NotificationType;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DestinationRepository destinationRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripAccessService tripAccessService;
    private final NotificationService notificationService;

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
        
        // Calculate status automatically based on dates
        trip.setStatus(computeAutomaticStatus(trip));

        Trip savedTrip = tripRepository.save(trip);

        // Notify administrator(s) of NEW_TRIP
        Role adminRole = roleRepository.findByName("ADMINISTRATOR").orElse(null);
        List<User> admins = (adminRole != null) ? userRepository.findByRole(adminRole) : userRepository.findByRoleName("ADMINISTRATOR");
        if (admins != null && !admins.isEmpty()) {
            String title = "New Trip Created";
            String message = String.format("A new trip '%s' has been created.", savedTrip.getTitle());
            for (User admin : admins) {
                if (admin != null && admin.getId() != null && !admin.getId().equals(user.getId())) {
                    notificationService.createNotification(
                            admin,
                            title,
                            message,
                            NotificationType.NEW_TRIP,
                            null,
                            null,
                            null
                    );
                }
            }
        }

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

        boolean destinationChanged = false;
        if (request.getDestinationId() != null) {
            Destination destination = destinationRepository.findById(request.getDestinationId())
                    .orElseThrow(() -> new RuntimeException("Destination not found with id: " + request.getDestinationId()));
            if (trip.getDestination() == null || !request.getDestinationId().equals(trip.getDestination().getId())) {
                destinationChanged = true;
            }
            trip.setDestination(destination);
        }

        boolean startDateChanged = (request.getStartDate() != null && !request.getStartDate().equals(trip.getStartDate()));
        boolean endDateChanged = (request.getEndDate() != null && !request.getEndDate().equals(trip.getEndDate()));

        if (request.getTitle() != null) {
            trip.setTitle(request.getTitle());
        }
        if (request.getStartDate() != null) {
            trip.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            trip.setEndDate(request.getEndDate());
        }

        if (request.getStatus() != null && "CANCELLED".equalsIgnoreCase(request.getStatus())) {
            trip.setStatus("CANCELLED");
        } else {
            trip.setStatus(computeAutomaticStatus(trip));
        }

        Trip updatedTrip = tripRepository.save(trip);

        if (destinationChanged || startDateChanged || endDateChanged) {
            Map<Integer, User> recipientMap = new LinkedHashMap<>();
            if (trip.getOwner() != null && trip.getOwner().getId() != null && !trip.getOwner().getId().equals(user.getId())) {
                recipientMap.put(trip.getOwner().getId(), trip.getOwner());
            }
            List<TripMember> members = tripMemberRepository.findByTripId(trip.getId());
            for (TripMember m : members) {
                if (m.getUser() != null && m.getUser().getId() != null && !m.getUser().getId().equals(user.getId())) {
                    recipientMap.put(m.getUser().getId(), m.getUser());
                }
            }

            String title = "Trip Updated";
            String message = String.format("The details for trip '%s' have been updated by %s.", trip.getTitle(), user.getName());
            for (User recipient : recipientMap.values()) {
                notificationService.createNotification(recipient, title, message, NotificationType.TRAVEL_UPDATE, null, trip.getId(), null);
            }
        }

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

    private String computeAutomaticStatus(Trip trip) {
        if (trip == null) return "PLANNED";
        if ("CANCELLED".equalsIgnoreCase(trip.getStatus())) {
            return "CANCELLED";
        }
        LocalDate today = LocalDate.now();
        LocalDate start = trip.getStartDate();
        LocalDate end = trip.getEndDate();

        if (start != null && today.isBefore(start)) {
            return "PLANNED";
        } else if (end != null && today.isAfter(end)) {
            return "COMPLETED";
        } else {
            return "ONGOING";
        }
    }

    private TripResponse mapToResponse(Trip t) {
        Integer destId = t.getDestination() != null ? t.getDestination().getId() : null;
        String destName = t.getDestination() != null ? t.getDestination().getName() : null;
        String destCountry = t.getDestination() != null ? t.getDestination().getCountry() : null;

        com.tripnest.tripnest_backend.dto.DestinationResponse destDto = null;
        if (t.getDestination() != null) {
            Destination d = t.getDestination();
            destDto = new com.tripnest.tripnest_backend.dto.DestinationResponse(
                    d.getId(),
                    d.getName(),
                    d.getCountry(),
                    d.getDescription(),
                    d.getWeatherInfo(),
                    d.getIsPopular()
            );
        }

        String computedStatus = computeAutomaticStatus(t);

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
                computedStatus,
                destDto
        );
    }
}
