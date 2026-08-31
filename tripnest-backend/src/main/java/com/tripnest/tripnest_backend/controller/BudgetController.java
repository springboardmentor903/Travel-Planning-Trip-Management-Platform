package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.service.BudgetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    // CREATE / SET BUDGET
    @PostMapping
    public ResponseEntity<Budget> createBudget(
            @RequestParam Integer tripId,
            @RequestParam BigDecimal totalBudget,
            @RequestParam(required = false, defaultValue = "USD") String currency,
            Authentication authentication) {

        String userEmail = authentication != null ? authentication.getName() : null;

        Budget budget = budgetService.createBudget(
                tripId,
                totalBudget,
                currency,
                userEmail
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(budget);
    }

    // UPDATE BUDGET BY ID
    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Integer id,
            @RequestParam BigDecimal totalBudget,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) BigDecimal totalSpent,
            Authentication authentication) {

        String userEmail = authentication != null ? authentication.getName() : null;

        Budget budget = budgetService.updateBudget(
                id,
                totalBudget,
                currency,
                totalSpent,
                userEmail
        );

        return ResponseEntity.ok(budget);
    }

    // GET BUDGET BY TRIP
    @GetMapping("/trip/{tripId}")
    public ResponseEntity<Budget> getBudgetByTrip(
            @PathVariable Integer tripId,
            Authentication authentication) {

        String userEmail = authentication != null ? authentication.getName() : null;

        return ResponseEntity.ok(
                budgetService.getBudgetByTripId(tripId, userEmail)
        );
    }
}