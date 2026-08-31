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

        // If approved, automatically add user to trip members
        if (newStatus == JoinRequestStatus.APPROVED) {
            User requester = request.getUser();
            if (!tripMemberRepository.existsByTripIdAndUserId(tripId, requester.getId())) {
                TripMember member = TripMember.builder()
                        .trip(trip)
                        .user(requester)
                        .role(TripRole.MEMBER)
                        .build();
                tripMemberRepository.save(member);
            }
        }

        return mapToResponse(saved);
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
        return new JoinRequestResponse(
                req.getId(),
                req.getTrip().getId(),
                req.getTrip().getTitle(),
                req.getUser().getId(),
                req.getUser().getName(),
                req.getUser().getEmail(),
                req.getStatus(),
                req.getCreatedAt()
        );
    }
}
