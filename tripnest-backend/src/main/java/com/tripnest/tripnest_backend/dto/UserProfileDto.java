package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Integer id;
    private String name;
    private String email;
    private String role;
    private String bio;
    private String travelPreferences;
    private String favoriteDestinations;
    private String preferredCurrency;
    private LocalDateTime createdAt;
}
