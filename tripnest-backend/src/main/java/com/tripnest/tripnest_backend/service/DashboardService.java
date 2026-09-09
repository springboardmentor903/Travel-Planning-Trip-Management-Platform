package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AdminDashboardResponse;
import com.tripnest.tripnest_backend.dto.TravelerDashboardResponse;
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.entity.*;
import com.tripnest.tripnest_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserRepository userRepository;
    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final NotificationRepository notificationRepository;
    private final DestinationRepository destinationRepository;

    @Transactional(readOnly = true)
    public TravelerDashboardResponse getTravelerDashboard(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        // Get all user trips (owned + joined as member)
        List<Trip> userTrips = getUserTrips(user.getId());
        LocalDate today = LocalDate.now();

        // 1. Component One: Upcoming Trips (strictly in the future)
        List<TripResponse> upcomingTrips = userTrips.stream()
                .filter(t -> t.getStartDate() != null && t.getStartDate().isAfter(today))
                .sorted(Comparator.comparing(Trip::getStartDate))
                .map(this::mapTripToResponse)
                .toList();

        // 2. Component Two: Budget Overview & 3. Component Three: Expense Summary & 5. Component Five: Stats
        double totalBudget = 0.0;
        double totalSpent = 0.0;
        Map<String, Double> categorySummaryMap = new LinkedHashMap<>();
        Set<String> visitedDestinations = new HashSet<>();

        for (Trip trip : userTrips) {
            // Budget sum
            Optional<Budget> budgetOpt = budgetRepository.findByTripId(trip.getId());
            if (budgetOpt.isPresent() && budgetOpt.get().getTotalBudget() != null) {
                totalBudget += budgetOpt.get().getTotalBudget().doubleValue();
            }

            // Expense sum & category breakdown
            List<Expense> expenses = expenseRepository.findByTripIdOrderByExpenseDateDesc(trip.getId());
            for (Expense e : expenses) {
                if (e.getAmount() != null) {
                    double amt = e.getAmount().doubleValue();
                    totalSpent += amt;

                    String category = e.getCategory() != null ? e.getCategory() : "Miscellaneous";
                    categorySummaryMap.put(category, categorySummaryMap.getOrDefault(category, 0.0) + amt);
                }
            }

            // Destinations count
            if (trip.getDestination() != null) {
                visitedDestinations.add(trip.getDestination().getName());
            }
        }

        double remainingBudget = Math.max(0.0, totalBudget - totalSpent);

        TravelerDashboardResponse.BudgetOverviewDto budgetOverview = TravelerDashboardResponse.BudgetOverviewDto.builder()
                .totalBudget(totalBudget)
                .totalSpent(totalSpent)
                .remainingBudget(remainingBudget)
                .build();

        // 4. Component Four: Favorite / Most-Visited Destinations
        List<String> favoriteList = new ArrayList<>();
        if (user.getFavoriteDestinations() != null && !user.getFavoriteDestinations().isBlank()) {
            favoriteList = Arrays.stream(user.getFavoriteDestinations().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }

        // Derive Most-Visited Destinations list
        Map<Destination, Long> destinationCounts = new HashMap<>();
        for (Trip trip : userTrips) {
            if (trip.getDestination() != null) {
                destinationCounts.put(trip.getDestination(), destinationCounts.getOrDefault(trip.getDestination(), 0L) + 1);
            }
        }

        List<TravelerDashboardResponse.VisitedDestinationDto> mostVisitedDestinations = destinationCounts.entrySet().stream()
                .sorted(Map.Entry.<Destination, Long>comparingByValue().reversed())
                .map(entry -> TravelerDashboardResponse.VisitedDestinationDto.builder()
                        .destinationId(entry.getKey().getId())
                        .destinationName(entry.getKey().getName())
                        .country(entry.getKey().getCountry())
                        .visitCount(entry.getValue())
                        .build())
                .toList();

        // 5. Component Five: Basic Travel Stats
        TravelerDashboardResponse.TravelStatsDto travelStats = TravelerDashboardResponse.TravelStatsDto.builder()
                .totalTripsTaken((long) userTrips.size())
                .uniqueDestinationsVisited((long) visitedDestinations.size())
                .totalAmountSpent(totalSpent)
                .build();

        return TravelerDashboardResponse.builder()
                .upcomingTrips(upcomingTrips)
                .budgetOverview(budgetOverview)
                .expenseSummary(categorySummaryMap)
                .favoriteDestinations(favoriteList)
                .mostVisitedDestinations(mostVisitedDestinations)
                .travelStats(travelStats)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard() {
        LocalDate today = LocalDate.now();

        // 1. Component One: User Analytics
        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();
        long travelerUsers = allUsers.stream().filter(u -> u.getRole() != null && "TRAVELER".equalsIgnoreCase(u.getRole().getName())).count();
        long adminUsers = allUsers.stream().filter(u -> u.getRole() != null && "ADMINISTRATOR".equalsIgnoreCase(u.getRole().getName())).count();

        AdminDashboardResponse.UserAnalyticsDto userAnalytics = AdminDashboardResponse.UserAnalyticsDto.builder()
                .totalUsers(totalUsers)
                .travelerUsers(travelerUsers)
                .adminUsers(adminUsers)
                .build();

        // 2. Component Two: Trip Analytics & 3. Admin Trip Visibility
        List<Trip> allTrips = tripRepository.findAll();
        long totalTrips = allTrips.size();

        long activeTrips = 0;
        long completedTrips = 0;
        long plannedTrips = 0;
        long cancelledTrips = 0;

        List<AdminDashboardResponse.AdminTripDetailDto> adminTripDetails = new ArrayList<>();

        for (Trip t : allTrips) {
            String status = computeTripStatus(t, today);
            switch (status) {
                case "ONGOING" -> activeTrips++;
                case "COMPLETED" -> completedTrips++;
                case "CANCELLED" -> cancelledTrips++;
                default -> plannedTrips++;
            }

            // Build members list for trip visibility
            List<AdminDashboardResponse.AdminTripMemberDto> memberDtos = new ArrayList<>();
            Set<Integer> addedUserIds = new HashSet<>();

            if (t.getOwner() != null) {
                memberDtos.add(AdminDashboardResponse.AdminTripMemberDto.builder()
                        .userId(t.getOwner().getId())
                        .name(t.getOwner().getName())
                        .email(t.getOwner().getEmail())
                        .role("OWNER")
                        .build());
                addedUserIds.add(t.getOwner().getId());
            }

            List<TripMember> members = tripMemberRepository.findByTripId(t.getId());
            for (TripMember tm : members) {
                if (tm.getUser() != null && !addedUserIds.contains(tm.getUser().getId())) {
                    memberDtos.add(AdminDashboardResponse.AdminTripMemberDto.builder()
                            .userId(tm.getUser().getId())
                            .name(tm.getUser().getName())
                            .email(tm.getUser().getEmail())
                            .role(tm.getRole() != null ? tm.getRole().name() : "MEMBER")
                            .build());
                    addedUserIds.add(tm.getUser().getId());
                }
            }

            adminTripDetails.add(AdminDashboardResponse.AdminTripDetailDto.builder()
                    .id(t.getId())
                    .title(t.getTitle())
                    .destinationId(t.getDestination() != null ? t.getDestination().getId() : null)
                    .destinationName(t.getDestination() != null ? t.getDestination().getName() : "Unspecified Destination")
                    .destinationCountry(t.getDestination() != null ? t.getDestination().getCountry() : "")
                    .startDate(t.getStartDate())
                    .endDate(t.getEndDate())
                    .status(status)
                    .ownerId(t.getOwner() != null ? t.getOwner().getId() : null)
                    .ownerName(t.getOwner() != null ? t.getOwner().getName() : "Unknown")
                    .ownerEmail(t.getOwner() != null ? t.getOwner().getEmail() : "")
                    .memberCount(memberDtos.size())
                    .members(memberDtos)
                    .build());
        }

        AdminDashboardResponse.TripAnalyticsDto tripAnalytics = AdminDashboardResponse.TripAnalyticsDto.builder()
                .totalTrips(totalTrips)
                .activeTrips(activeTrips)
                .completedTrips(completedTrips)
                .plannedTrips(plannedTrips)
                .cancelledTrips(cancelledTrips)
                .build();

        // 3. Component Three: Destination Analytics (Most Popular Destinations across all trips)
        Map<Destination, Long> destTripCounts = new HashMap<>();
        for (Trip t : allTrips) {
            if (t.getDestination() != null) {
                destTripCounts.put(t.getDestination(), destTripCounts.getOrDefault(t.getDestination(), 0L) + 1);
            }
        }

        List<AdminDashboardResponse.DestinationAnalyticsDto> destinationAnalytics = destTripCounts.entrySet().stream()
                .sorted(Map.Entry.<Destination, Long>comparingByValue().reversed())
                .map(entry -> AdminDashboardResponse.DestinationAnalyticsDto.builder()
                        .destinationId(entry.getKey().getId())
                        .destinationName(entry.getKey().getName())
                        .country(entry.getKey().getCountry())
                        .tripCount(entry.getValue())
                        .build())
                .toList();

        // 4. Component Four: Platform Stats
        BigDecimal totalExpensesDecimal = expenseRepository.getTotalExpensesAcrossAllTrips();
        double totalExpensesLogged = totalExpensesDecimal != null ? totalExpensesDecimal.doubleValue() : 0.0;
        long totalNotificationsSent = notificationRepository.count();

        AdminDashboardResponse.PlatformStatsDto platformStats = AdminDashboardResponse.PlatformStatsDto.builder()
                .totalExpensesLogged(totalExpensesLogged)
                .totalNotificationsSent(totalNotificationsSent)
                .build();

        return AdminDashboardResponse.builder()
                .userAnalytics(userAnalytics)
                .tripAnalytics(tripAnalytics)
                .destinationAnalytics(destinationAnalytics)
                .platformStats(platformStats)
                .allTrips(adminTripDetails)
                .build();
    }

    private List<Trip> getUserTrips(Integer userId) {
        Map<Integer, Trip> map = new LinkedHashMap<>();

        // Owned
        for (Trip t : tripRepository.findByOwnerId(userId)) {
            map.put(t.getId(), t);
        }
        // Joined
        for (TripMember tm : tripMemberRepository.findByUserId(userId)) {
            if (tm.getTrip() != null) {
                map.put(tm.getTrip().getId(), tm.getTrip());
            }
        }
        return new ArrayList<>(map.values());
    }

    private String computeTripStatus(Trip trip, LocalDate today) {
        if (trip.getStatus() != null && !trip.getStatus().isBlank()) {
            return trip.getStatus().toUpperCase();
        }
        if (trip.getStartDate() == null || trip.getEndDate() == null) {
            return "PLANNED";
        }
        if (today.isBefore(trip.getStartDate())) {
            return "PLANNED";
        } else if (today.isAfter(trip.getEndDate())) {
            return "COMPLETED";
        } else {
            return "ONGOING";
        }
    }

    private TripResponse mapTripToResponse(Trip trip) {
        TripResponse res = new TripResponse();
        res.setId(trip.getId());
        res.setTitle(trip.getTitle());
        res.setStartDate(trip.getStartDate());
        res.setEndDate(trip.getEndDate());
        res.setStatus(computeTripStatus(trip, LocalDate.now()));

        if (trip.getOwner() != null) {
            res.setOwnerId(trip.getOwner().getId());
            res.setOwnerName(trip.getOwner().getName());
        }

        if (trip.getDestination() != null) {
            res.setDestinationId(trip.getDestination().getId());
            res.setDestinationName(trip.getDestination().getName());
            res.setDestinationCountry(trip.getDestination().getCountry());
        }
        return res;
    }
}
