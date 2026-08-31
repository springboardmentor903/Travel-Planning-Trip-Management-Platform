package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.TripMemberResponse;
import com.tripnest.tripnest_backend.entity.TripRole;
import com.tripnest.tripnest_backend.service.TripMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/members")
@RequiredArgsConstructor
public class TripMemberController {

    private final TripMemberService tripMemberService;

    // ADD MEMBER BY EMAIL
    @PostMapping
    public ResponseEntity<TripMemberResponse> addMember(
            @PathVariable Integer tripId,
            @RequestParam String email,
            @RequestParam(required = false, defaultValue = "MEMBER") TripRole role,
            Authentication authentication) {

        TripMemberResponse response = tripMemberService.addMemberByEmail(
                tripId,
                email,
                role,
                authentication.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // LIST ALL MEMBERS OF A TRIP
    @GetMapping
    public ResponseEntity<List<TripMemberResponse>> getMembers(
            @PathVariable Integer tripId,
            Authentication authentication) {

        List<TripMemberResponse> members = tripMemberService.getTripMembers(
                tripId,
                authentication.getName()
        );
        return ResponseEntity.ok(members);
    }

    // REMOVE MEMBER FROM TRIP
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Integer tripId,
            @PathVariable Integer userId,
            Authentication authentication) {

        tripMemberService.removeMember(
                tripId,
                userId,
                authentication.getName()
        );
        return ResponseEntity.noContent().build();
    }

    // CHANGE MEMBER ROLE
    @PutMapping("/{userId}/role")
    public ResponseEntity<TripMemberResponse> updateMemberRole(
            @PathVariable Integer tripId,
            @PathVariable Integer userId,
            @RequestParam TripRole role,
            Authentication authentication) {

        TripMemberResponse response = tripMemberService.updateMemberRole(
                tripId,
                userId,
                role,
                authentication.getName()
        );
        return ResponseEntity.ok(response);
    }
}
