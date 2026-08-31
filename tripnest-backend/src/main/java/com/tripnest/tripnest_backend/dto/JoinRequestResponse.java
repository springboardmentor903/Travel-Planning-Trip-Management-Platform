package com.tripnest.tripnest_backend.dto;

import com.tripnest.tripnest_backend.entity.JoinRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequestResponse {
    private Integer id;
    private Integer tripId;
    private String tripTitle;
    private Integer userId;
    private String userName;
    private String userEmail;
    private JoinRequestStatus status;
    private LocalDateTime createdAt;
}
