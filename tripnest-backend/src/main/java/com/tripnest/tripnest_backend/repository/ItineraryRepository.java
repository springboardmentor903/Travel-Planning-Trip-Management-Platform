package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryRepository extends JpaRepository<Itinerary, Integer> {

    List<Itinerary> findByTripIdOrderByDayNumberAsc(Integer tripId);
    List<Itinerary> findByDayDate(java.time.LocalDate dayDate);
}