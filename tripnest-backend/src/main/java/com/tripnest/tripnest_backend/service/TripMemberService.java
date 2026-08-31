package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.TripMemberResponse;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.entity.TripRole;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TripMemberService {

    private final TripMemberRepository tripMemberRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripAccessService tripAccessService;

    public TripMemberResponse addMemberByEmail(Integer tripId, String email, TripRole role, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Trip trip = getTripById(tripId);

        // Restrict member addition to Group Admin or Trip Owner
        tripAccessService.verifyGroupAdminOrOwner(trip, actor);

        User targetUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (trip.getOwner().getId().equals(targetUser.getId())) {
            throw new RuntimeException("User is already the owner of this trip");
        }

        if (tripMemberRepository.existsByTripIdAndUserId(tripId, targetUser.getId())) {
            throw new RuntimeException("User is already a member of this trip");
        }

        TripRole effectiveRole = (role != null) ? role : TripRole.MEMBER;

        TripMember member = TripMember.builder()
                .trip(trip)
                .user(targetUser)
                .role(effectiveRole)
                .build();

        TripMember saved = tripMemberRepository.save(member);
        return mapToResponse(saved);
    }

    public List<TripMemberResponse> getTripMembers(Integer tripId, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Trip trip = getTripById(tripId);

        // Member listing is accessible to any valid trip member/owner
        tripAccessService.verifyAccess(trip, actor);

        List<TripMemberResponse> list = new ArrayList<>();

        // Add Trip Owner as Group Admin
        User owner = trip.getOwner();
        list.add(new TripMemberResponse(
                0,
                trip.getId(),
                owner.getId(),
                owner.getName(),
                owner.getEmail(),
                TripRole.GROUP_ADMIN,
                null
        ));

        // Add registered members
        List<TripMember> members = tripMemberRepository.findByTripId(tripId);
        for (TripMember m : members) {
            if (!m.getUser().getId().equals(owner.getId())) {
                list.add(mapToResponse(m));
            }
        }

        return list;
    }

    public void removeMember(Integer tripId, Integer targetUserId, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Trip trip = getTripById(tripId);

        // Restrict removal to Group Admin or Trip Owner
        tripAccessService.verifyGroupAdminOrOwner(trip, actor);

        if (trip.getOwner().getId().equals(targetUserId)) {
            throw new RuntimeException("Cannot remove the trip owner from the trip");
        }

        TripMember member = tripMemberRepository.findByTripIdAndUserId(tripId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Member not found in trip"));

        tripMemberRepository.delete(member);
    }

    public TripMemberResponse updateMemberRole(Integer tripId, Integer targetUserId, TripRole newRole, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Trip trip = getTripById(tripId);

        // Restrict role changes to Group Admin or Trip Owner
        tripAccessService.verifyGroupAdminOrOwner(trip, actor);

        if (trip.getOwner().getId().equals(targetUserId)) {
            throw new RuntimeException("Cannot change role of the trip owner");
        }

        TripMember member = tripMemberRepository.findByTripIdAndUserId(tripId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Member not found in trip"));

        member.setRole(newRole);
        TripMember saved = tripMemberRepository.save(member);
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

    private TripMemberResponse mapToResponse(TripMember m) {
        return new TripMemberResponse(
                m.getId(),
                m.getTrip().getId(),
                m.getUser().getId(),
                m.getUser().getName(),
                m.getUser().getEmail(),
                m.getRole(),
                m.getCreatedAt()
        );
    }
}
