package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Integer> {
    List<Trip> findByOwnerId(Integer ownerId);
    List<Trip> findByStartDate(java.time.LocalDate startDate);
}
