package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {
    private UserAnalyticsDto userAnalytics;
    private TripAnalyticsDto tripAnalytics;
    private List<DestinationAnalyticsDto> destinationAnalytics;
    private PlatformStatsDto platformStats;
    private List<AdminTripDetailDto> allTrips;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserAnalyticsDto {
        private Long totalUsers;
        private Long travelerUsers;
        private Long adminUsers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TripAnalyticsDto {
        private Long totalTrips;
        private Long activeTrips;
        private Long completedTrips;
        private Long plannedTrips;
        private Long cancelledTrips;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DestinationAnalyticsDto {
        private Integer destinationId;
        private String destinationName;
        private String country;
        private Long tripCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlatformStatsDto {
        private Double totalExpensesLogged;
        private Long totalNotificationsSent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminTripDetailDto {
        private Integer id;
        private String title;
        private Integer destinationId;
        private String destinationName;
        private String destinationCountry;
        private LocalDate startDate;
        private LocalDate endDate;
        private String status;
        private Integer ownerId;
        private String ownerName;
        private String ownerEmail;
        private Integer memberCount;
        private List<AdminTripMemberDto> members;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminTripMemberDto {
        private Integer userId;
        private String name;
        private String email;
        private String role;
    }
}
