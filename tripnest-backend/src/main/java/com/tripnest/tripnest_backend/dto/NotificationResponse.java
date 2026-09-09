package com.tripnest.tripnest_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.tripnest.tripnest_backend.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Integer id;
    private String title;
    private String message;
    private NotificationType type;

    @JsonProperty("read")
    private boolean read;

    private LocalDateTime createdAt;
    private Integer tripId;
    private Integer activityId;
}
