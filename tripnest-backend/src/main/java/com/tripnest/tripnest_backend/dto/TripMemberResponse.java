package com.tripnest.tripnest_backend.dto;

import com.tripnest.tripnest_backend.entity.TripRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripMemberResponse {
    private Integer id;
    private Integer tripId;
    private Integer userId;
    private String userName;
    private String userEmail;
    private TripRole role;
    private LocalDateTime joinedAt;
}
