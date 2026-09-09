package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AttractionRequest;
import com.tripnest.tripnest_backend.dto.AttractionResponse;
import com.tripnest.tripnest_backend.entity.Attraction;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttractionService {

    private final AttractionRepository attractionRepository;
    private final DestinationRepository destinationRepository;

    @Transactional(readOnly = true)
    public List<AttractionResponse> getAttractionsByDestination(Integer destinationId) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found with id: " + destinationId));

        return attractionRepository.findByDestinationId(destination.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public AttractionResponse createAttraction(Integer destinationId, AttractionRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Attraction name is required");
        }
        if (request.getShortDescription() == null || request.getShortDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Attraction short description is required");
        }

        String name = request.getName().trim();
        String desc = request.getShortDescription().trim();

        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found with id: " + destinationId));

        if (attractionRepository.existsByDestinationIdAndNameIgnoreCase(destinationId, name)) {
            throw new IllegalArgumentException("An attraction with this name already exists for this destination.");
        }

        Attraction attraction = Attraction.builder()
                .destination(destination)
                .name(name)
                .shortDescription(desc)
                .build();

        Attraction saved = attractionRepository.save(attraction);
        return mapToResponse(saved);
    }

    private AttractionResponse mapToResponse(Attraction a) {
        String desc = a.getShortDescription();
        if (desc == null || desc.trim().isEmpty()) {
            String destName = (a.getDestination() != null) ? a.getDestination().getName() : "the area";
            desc = "Popular point of interest in " + destName + " offering landmark views and cultural history.";
        }
        return new AttractionResponse(
                a.getId(),
                a.getName(),
                desc,
                a.getDestination().getId()
        );
    }
}
