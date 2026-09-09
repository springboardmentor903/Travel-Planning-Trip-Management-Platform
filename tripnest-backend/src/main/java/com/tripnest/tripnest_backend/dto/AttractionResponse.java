package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttractionResponse {
    private Integer id;
    private String name;
    private String shortDescription;
    private Integer destinationId;
}
