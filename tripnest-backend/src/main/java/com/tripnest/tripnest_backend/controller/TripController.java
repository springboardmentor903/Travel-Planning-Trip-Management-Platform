package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.TripRequest;
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    public ResponseEntity<TripResponse> createTrip(@Valid @RequestBody TripRequest request, Authentication authentication) {
        TripResponse response = tripService.createTrip(request, authentication.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my-trips")
    public ResponseEntity<List<TripResponse>> getMyTrips(Authentication authentication) {
        return ResponseEntity.ok(tripService.getMyTrips(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getTripById(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(tripService.getTripById(id, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripResponse> updateTrip(@PathVariable Integer id, @Valid @RequestBody TripRequest request, Authentication authentication) {
        return ResponseEntity.ok(tripService.updateTrip(id, request, authentication.getName()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<TripResponse>> searchTrips(@RequestParam(required = false) String name) {
        return ResponseEntity.ok(tripService.searchTripsByName(name));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Integer id, Authentication authentication) {
        tripService.deleteTrip(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
