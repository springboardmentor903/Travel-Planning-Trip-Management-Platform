package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelerDashboardResponse {
    private List<TripResponse> upcomingTrips;
    private BudgetOverviewDto budgetOverview;
    private Map<String, Double> expenseSummary;
    private List<String> favoriteDestinations;
    private List<VisitedDestinationDto> mostVisitedDestinations;
    private TravelStatsDto travelStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BudgetOverviewDto {
        private Double totalBudget;
        private Double totalSpent;
        private Double remainingBudget;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VisitedDestinationDto {
        private Integer destinationId;
        private String destinationName;
        private String country;
        private Long visitCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TravelStatsDto {
        private Long totalTripsTaken;
        private Long uniqueDestinationsVisited;
        private Double totalAmountSpent;
    }
}
