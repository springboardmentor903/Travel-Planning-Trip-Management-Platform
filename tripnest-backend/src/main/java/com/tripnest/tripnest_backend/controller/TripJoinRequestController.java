package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.JoinRequestResponse;
import com.tripnest.tripnest_backend.entity.JoinRequestStatus;
import com.tripnest.tripnest_backend.service.TripJoinRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripJoinRequestController {

    private final TripJoinRequestService tripJoinRequestService;

    // SUBMIT A JOIN REQUEST FOR A TRIP
    @PostMapping("/{tripId}/join-request")
    public ResponseEntity<JoinRequestResponse> createJoinRequest(
            @PathVariable Integer tripId,
            Authentication authentication) {

        JoinRequestResponse response = tripJoinRequestService.createJoinRequest(
                tripId,
                authentication.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // LIST PENDING JOIN REQUESTS FOR A TRIP (Admin/Owner only)
    @GetMapping("/{tripId}/join-requests")
    public ResponseEntity<List<JoinRequestResponse>> getPendingJoinRequests(
            @PathVariable Integer tripId,
            Authentication authentication) {

        List<JoinRequestResponse> requests = tripJoinRequestService.getPendingJoinRequests(
                tripId,
                authentication.getName()
        );
        return ResponseEntity.ok(requests);
    }

    // RESPOND TO JOIN REQUEST (APPROVE or REJECT)
    @PutMapping("/{tripId}/join-requests/{requestId}/respond")
    public ResponseEntity<JoinRequestResponse> respondToJoinRequest(
            @PathVariable Integer tripId,
            @PathVariable Integer requestId,
            @RequestParam JoinRequestStatus status,
            Authentication authentication) {

        JoinRequestResponse response = tripJoinRequestService.respondToJoinRequest(
                tripId,
                requestId,
                status,
                authentication.getName()
        );
        return ResponseEntity.ok(response);
    }
}
