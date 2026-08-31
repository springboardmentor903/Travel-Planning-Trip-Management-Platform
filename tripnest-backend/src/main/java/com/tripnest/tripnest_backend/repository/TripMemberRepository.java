package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, Integer> {
    Optional<TripMember> findByTripIdAndUserId(Integer tripId, Integer userId);
    List<TripMember> findByTripId(Integer tripId);
    List<TripMember> findByUserId(Integer userId);
    boolean existsByTripIdAndUserId(Integer tripId, Integer userId);
    void deleteByTripIdAndUserId(Integer tripId, Integer userId);
}
