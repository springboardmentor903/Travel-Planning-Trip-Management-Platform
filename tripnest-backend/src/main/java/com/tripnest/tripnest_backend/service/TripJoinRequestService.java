package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.JoinRequestResponse;
import com.tripnest.tripnest_backend.entity.*;
import com.tripnest.tripnest_backend.repository.TripJoinRequestRepository;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TripJoinRequestService {

    private final TripJoinRequestRepository tripJoinRequestRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripAccessService tripAccessService;
    private final NotificationService notificationService;

    @Transactional
    public JoinRequestResponse createJoinRequest(Integer tripId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Trip trip = getTripById(tripId);

        if (trip.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You are the owner of this trip");
        }

        if (tripMemberRepository.existsByTripIdAndUserId(tripId, user.getId())) {
            throw new RuntimeException("You are already a member of this trip");
        }

        var existingPending = tripJoinRequestRepository.findByTripIdAndUserIdAndStatus(
                tripId, user.getId(), JoinRequestStatus.PENDING
        );
        if (existingPending.isPresent()) {
            throw new RuntimeException("You already have a pending join request for this trip");
        }

        TripJoinRequest request = TripJoinRequest.builder()
                .trip(trip)
                .user(user)
                .status(JoinRequestStatus.PENDING)
                .build();

        TripJoinRequest saved = tripJoinRequestRepository.save(request);

        User tripOwner = trip.getOwner();
        if (tripOwner == null || tripOwner.getId() == null) {
            throw new RuntimeException("Trip owner not found for trip ID: " + tripId);
        }

        // Send notification to trip owner/admin
        String title = "New Join Request";
        String message = user.getName() + " has requested to join your trip '" + trip.getTitle() + "'.";
        notificationService.createNotification(tripOwner, title, message, NotificationType.JOIN_REQUEST, null, trip.getId(), null);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<JoinRequestResponse> getPendingJoinRequests(Integer tripId, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Trip trip = getTripById(tripId);

        // Only Group Admin or Trip Owner can view join requests
        tripAccessService.verifyGroupAdminOrOwner(trip, actor);

        return tripJoinRequestRepository.findByTripIdAndStatus(tripId, JoinRequestStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public JoinRequestResponse respondToJoinRequest(
            Integer tripId,
            Integer requestId,
            JoinRequestStatus newStatus,
            String actorEmail) {

        User actor = getUserByEmail(actorEmail);
        Trip trip = getTripById(tripId);

        // Only Group Admin or Trip Owner can respond to join requests
        tripAccessService.verifyGroupAdminOrOwner(trip, actor);

        TripJoinRequest request = tripJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found with id: " + requestId));

        if (!request.getTrip().getId().equals(tripId)) {
            throw new RuntimeException("Join request does not belong to this trip");
        }

        request.setStatus(newStatus);
        TripJoinRequest saved = tripJoinRequestRepository.save(request);

        User requester = request.getUser();
        if (requester == null || requester.getId() == null) {
            throw new RuntimeException("Requester user not found for join request: " + requestId);
        }

        // If approved, automatically add user to trip members
        if (newStatus == JoinRequestStatus.APPROVED) {
            if (!tripMemberRepository.existsByTripIdAndUserId(tripId, requester.getId())) {
                TripMember member = TripMember.builder()
                        .trip(trip)
                        .user(requester)
                        .role(TripRole.MEMBER)
                        .build();
                tripMemberRepository.save(member);
            }
            String title = "Join Request Approved";
            String message = "Your request to join '" + trip.getTitle() + "' has been approved.";
            notificationService.createNotification(requester, title, message, NotificationType.JOIN_REQUEST_APPROVED, null, trip.getId(), null);
        } else if (newStatus == JoinRequestStatus.REJECTED) {
            String title = "Join Request Rejected";
            String message = "Your request to join '" + trip.getTitle() + "' has been rejected.";
            notificationService.createNotification(requester, title, message, NotificationType.JOIN_REQUEST_REJECTED, null, trip.getId(), null);
        }

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<JoinRequestResponse> getMyJoinRequests(String userEmail) {
        User user = getUserByEmail(userEmail);
        return tripJoinRequestRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private Trip getTripById(Integer tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));
    }

    private JoinRequestResponse mapToResponse(TripJoinRequest req) {
        Trip trip = req.getTrip();
        String destName = (trip.getDestination() != null) ? trip.getDestination().getName() : null;
        String destCountry = (trip.getDestination() != null) ? trip.getDestination().getCountry() : null;
        String ownerName = (trip.getOwner() != null) ? trip.getOwner().getName() : null;

        return JoinRequestResponse.builder()
                .id(req.getId())
                .tripId(trip.getId())
                .tripTitle(trip.getTitle())
                .userId(req.getUser().getId())
                .userName(req.getUser().getName())
                .userEmail(req.getUser().getEmail())
                .status(req.getStatus())
                .createdAt(req.getCreatedAt())
                .destinationName(destName)
                .destinationCountry(destCountry)
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .ownerName(ownerName)
                .build();
    }
}
