package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripAccessService tripAccessService;

    // CREATE OR UPDATE BUDGET
    public Budget createBudget(
            Integer tripId,
            BigDecimal totalBudget,
            String currency,
            String userEmail) {

        validateTotalBudget(totalBudget);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        if (userEmail != null) {
            User user = getUserByEmail(userEmail);
            tripAccessService.verifyAccess(trip, user);
        }

        if (currency == null || currency.isBlank()) {
            currency = "USD";
        }

        var existing = budgetRepository.findByTripId(tripId);
        if (existing.isPresent()) {
            Budget b = existing.get();
            b.setTotalBudget(totalBudget);
            b.setCurrency(currency);
            BigDecimal spent = b.getTotalSpent() != null ? b.getTotalSpent() : BigDecimal.ZERO;
            b.setRemainingBudget(totalBudget.subtract(spent));
            return budgetRepository.save(b);
        }

        Budget budget = Budget.builder()
                .trip(trip)
                .totalBudget(totalBudget)
                .totalSpent(BigDecimal.ZERO)
                .remainingBudget(totalBudget)
                .currency(currency)
                .build();

        return budgetRepository.save(budget);
    }

    public Budget createBudget(Integer tripId, BigDecimal totalBudget, String currency) {
        return createBudget(tripId, totalBudget, currency, null);
    }

    // UPDATE BUDGET BY ID
    public Budget updateBudget(
            Integer budgetId,
            BigDecimal totalBudget,
            String currency,
            BigDecimal totalSpent,
            String userEmail) {

        validateTotalBudget(totalBudget);

        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }

        if (totalSpent.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Total spent cannot be negative");
        }

        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found with id: " + budgetId));

        if (userEmail != null) {
            User user = getUserByEmail(userEmail);
            tripAccessService.verifyAccess(budget.getTrip(), user);
        }

        budget.setTotalBudget(totalBudget);
        budget.setTotalSpent(totalSpent);
        if (currency != null && !currency.isBlank()) {
            budget.setCurrency(currency);
        }

        BigDecimal remainingBudget = totalBudget.subtract(totalSpent);
        budget.setRemainingBudget(remainingBudget);

        return budgetRepository.save(budget);
    }

    public Budget updateBudget(Integer budgetId, BigDecimal totalBudget, String currency, BigDecimal totalSpent) {
        return updateBudget(budgetId, totalBudget, currency, totalSpent, null);
    }

    // GET BUDGET BY TRIP
    public Budget getBudgetByTripId(Integer tripId, String userEmail) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        if (userEmail != null) {
            User user = getUserByEmail(userEmail);
            tripAccessService.verifyAccess(trip, user);
        }

        return budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new RuntimeException("Budget not found for trip id: " + tripId));
    }

    public Budget getBudgetByTripId(Integer tripId) {
        return getBudgetByTripId(tripId, null);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private void validateTotalBudget(BigDecimal totalBudget) {
        if (totalBudget == null) {
            throw new RuntimeException("Total budget is required");
        }
        if (totalBudget.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Total budget must be greater than zero");
        }
    }
}