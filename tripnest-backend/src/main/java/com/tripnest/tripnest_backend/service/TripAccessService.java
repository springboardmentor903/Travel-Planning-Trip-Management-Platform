package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.entity.TripRole;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TripAccessService {

    private final TripMemberRepository tripMemberRepository;

    /**
     * Checks if the user is allowed to access the trip (read/write itinerary, activities, budget, expenses).
     * Access is granted if the user is:
     * 1. The Trip Owner
     * 2. A System Administrator
     * 3. A registered member of the trip (MEMBER or GROUP_ADMIN)
     */
    public boolean hasAccess(Trip trip, User user) {
        if (trip == null || user == null) return false;

        // 1. Owner check
        if (trip.getOwner() != null && trip.getOwner().getId().equals(user.getId())) {
            return true;
        }

        // 2. System Administrator check
        if (user.getRole() != null && "ADMINISTRATOR".equalsIgnoreCase(user.getRole().getName())) {
            return true;
        }

        // 3. Trip Member check
        return tripMemberRepository.existsByTripIdAndUserId(trip.getId(), user.getId());
    }

    /**
     * Throws an exception if user does NOT have access to the trip.
     */
    public void verifyAccess(Trip trip, User user) {
        if (!hasAccess(trip, user)) {
            throw new RuntimeException("You do not have permission to access this trip");
        }
    }

    /**
     * Checks if the user is a Group Admin or Trip Owner (or System Administrator).
     */
    public boolean isGroupAdminOrOwner(Trip trip, User user) {
        if (trip == null || user == null) return false;

        // Owner check
        if (trip.getOwner() != null && trip.getOwner().getId().equals(user.getId())) {
            return true;
        }

        // System Administrator check
        if (user.getRole() != null && "ADMINISTRATOR".equalsIgnoreCase(user.getRole().getName())) {
            return true;
        }

        // Group Admin check
        Optional<TripMember> memberOpt = tripMemberRepository.findByTripIdAndUserId(trip.getId(), user.getId());
        return memberOpt.isPresent() && memberOpt.get().getRole() == TripRole.GROUP_ADMIN;
    }

    /**
     * Throws an exception if user is NOT a Group Admin or Trip Owner.
     */
    public void verifyGroupAdminOrOwner(Trip trip, User user) {
        if (!isGroupAdminOrOwner(trip, user)) {
            throw new RuntimeException("Only the Trip Owner or a Group Admin can perform this operation");
        }
    }
}
