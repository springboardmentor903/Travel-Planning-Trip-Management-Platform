package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.JoinRequestStatus;
import com.tripnest.tripnest_backend.entity.TripJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripJoinRequestRepository extends JpaRepository<TripJoinRequest, Integer> {
    List<TripJoinRequest> findByTripIdAndStatus(Integer tripId, JoinRequestStatus status);
    List<TripJoinRequest> findByUserId(Integer userId);
    Optional<TripJoinRequest> findByTripIdAndUserIdAndStatus(Integer tripId, Integer userId, JoinRequestStatus status);
}
