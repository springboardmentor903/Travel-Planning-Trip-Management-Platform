package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.AttractionRequest;
import com.tripnest.tripnest_backend.dto.AttractionResponse;
import com.tripnest.tripnest_backend.service.AttractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations/{destinationId}/attractions")
@RequiredArgsConstructor
public class AttractionController {

    private final AttractionService attractionService;

    @GetMapping
    public ResponseEntity<List<AttractionResponse>> getAttractions(@PathVariable Integer destinationId) {
        return ResponseEntity.ok(attractionService.getAttractionsByDestination(destinationId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<AttractionResponse> createAttraction(
            @PathVariable Integer destinationId,
            @Valid @RequestBody AttractionRequest request) {
        AttractionResponse created = attractionService.createAttraction(destinationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
