package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripResponse {
    private Integer id;
    private String title;
    private Integer ownerId;
    private String ownerName;
    private Integer destinationId;
    private String destinationName;
    private String destinationCountry;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private DestinationResponse destination;
}
