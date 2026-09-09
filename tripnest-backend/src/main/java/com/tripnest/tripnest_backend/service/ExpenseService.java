package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Expense;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.entity.NotificationType;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import com.tripnest.tripnest_backend.repository.ExpenseRepository;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final TripAccessService tripAccessService;
    private final NotificationService notificationService;
    private final TripMemberRepository tripMemberRepository;

    // ============================================================
    // CREATE EXPENSE
    // ============================================================

    @Transactional
    public Expense createExpense(
            Integer tripId,
            Integer budgetId,
            Integer payerId,
            String category,
            BigDecimal amount,
            LocalDate expenseDate,
            String receiptLink,
            String userEmail) {

        validateCategory(category);
        validateAmount(amount);

        User loggedInUser = getUserByEmail(userEmail);
        Trip trip = getTripById(tripId);

        // Reusable unified access check
        tripAccessService.verifyAccess(trip, loggedInUser);

        // Resolve budget: if null, find or create default budget
        Budget budget;
        if (budgetId != null) {
            budget = getBudgetById(budgetId);
            verifyBudgetBelongsToTrip(budget, trip);
        } else {
            budget = budgetRepository.findByTripId(tripId)
                    .orElseGet(() -> budgetRepository.save(
                            Budget.builder()
                                    .trip(trip)
                                    .totalBudget(new BigDecimal("1000.00"))
                                    .totalSpent(BigDecimal.ZERO)
                                    .remainingBudget(new BigDecimal("1000.00"))
                                    .currency("USD")
                                    .build()
                    ));
        }

        // Resolve payer: if null, default to loggedInUser
        User payer = (payerId != null) ? getUserById(payerId) : loggedInUser;
        validatePayerConnection(payer, trip);

        Expense expense = Expense.builder()
                .trip(trip)
                .budget(budget)
                .payer(payer)
                .category(category.trim())
                .amount(amount)
                .expenseDate(expenseDate != null ? expenseDate : LocalDate.now())
                .receiptLink(receiptLink)
                .build();

        Expense saved = expenseRepository.save(expense);
        recalculateBudget(trip);
        checkBudgetAlerts(trip);
        return saved;
    }

    // ============================================================
    // GET ALL EXPENSES FOR TRIP
    // ============================================================

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByTrip(
            Integer tripId,
            String userEmail) {

        User user = getUserByEmail(userEmail);
        Trip trip = getTripById(tripId);

        tripAccessService.verifyAccess(trip, user);

        return expenseRepository.findByTripIdOrderByExpenseDateDesc(tripId);
    }

    // ============================================================
    // GET EXPENSE BY ID
    // ============================================================

    @Transactional(readOnly = true)
    public Expense getExpenseById(
            Integer expenseId,
            String userEmail) {

        Expense expense = getExpense(expenseId);
        User user = getUserByEmail(userEmail);

        tripAccessService.verifyAccess(expense.getTrip(), user);

        return expense;
    }

    // ============================================================
    // UPDATE EXPENSE
    // ============================================================

    @Transactional
    public Expense updateExpense(
            Integer expenseId,
            Integer budgetId,
            Integer payerId,
            String category,
            BigDecimal amount,
            LocalDate expenseDate,
            String receiptLink,
            String userEmail) {

        validateCategory(category);
        validateAmount(amount);

        Expense expense = getExpense(expenseId);
        User loggedInUser = getUserByEmail(userEmail);

        tripAccessService.verifyAccess(expense.getTrip(), loggedInUser);

        // Resolve budget
        Budget budget;
        if (budgetId != null) {
            budget = getBudgetById(budgetId);
            verifyBudgetBelongsToTrip(budget, expense.getTrip());
        } else {
            budget = expense.getBudget() != null ? expense.getBudget() :
                    budgetRepository.findByTripId(expense.getTrip().getId()).orElse(null);
        }

        // Resolve payer
        User payer = (payerId != null) ? getUserById(payerId) :
                (expense.getPayer() != null ? expense.getPayer() : loggedInUser);
        validatePayerConnection(payer, expense.getTrip());

        if (budget != null) expense.setBudget(budget);
        expense.setPayer(payer);
        expense.setCategory(category.trim());
        expense.setAmount(amount);

        if (expenseDate != null) {
            expense.setExpenseDate(expenseDate);
        }

        expense.setReceiptLink(receiptLink);

        Expense updated = expenseRepository.save(expense);
        recalculateBudget(expense.getTrip());
        checkBudgetAlerts(expense.getTrip());
        return updated;
    }

    // ============================================================
    // DELETE EXPENSE
    // ============================================================

    @Transactional
    public void deleteExpense(
            Integer expenseId,
            String userEmail) {

        Expense expense = getExpense(expenseId);
        User user = getUserByEmail(userEmail);

        tripAccessService.verifyAccess(expense.getTrip(), user);

        Trip trip = expense.getTrip();
        expenseRepository.delete(expense);
        recalculateBudget(trip);
    }

    private void recalculateBudget(Trip trip) {
        if (trip == null) return;
        budgetRepository.findByTripId(trip.getId()).ifPresent(budget -> {
            BigDecimal totalSpent = expenseRepository.getTotalExpensesByTripId(trip.getId());
            if (totalSpent == null) totalSpent = BigDecimal.ZERO;
            budget.setTotalSpent(totalSpent);
            budget.setRemainingBudget(budget.getTotalBudget().subtract(totalSpent));
            budgetRepository.save(budget);
        });
    }

    private void checkBudgetAlerts(Trip trip) {
        if (trip == null || trip.getId() == null) return;
        budgetRepository.findByTripId(trip.getId()).ifPresent(budget -> {
            BigDecimal totalBudget = budget.getTotalBudget();
            BigDecimal totalSpent = budget.getTotalSpent();
            if (totalBudget == null || totalBudget.compareTo(BigDecimal.ZERO) <= 0 || totalSpent == null) {
                return;
            }

            Map<Integer, User> recipientMap = new LinkedHashMap<>();
            if (trip.getOwner() != null && trip.getOwner().getId() != null) {
                recipientMap.put(trip.getOwner().getId(), trip.getOwner());
            }
            List<TripMember> members = tripMemberRepository.findByTripId(trip.getId());
            for (TripMember tm : members) {
                if (tm.getUser() != null && tm.getUser().getId() != null) {
                    recipientMap.put(tm.getUser().getId(), tm.getUser());
                }
            }

            // Check 100% threshold
            if (totalSpent.compareTo(totalBudget) >= 0) {
                String title = "Budget Exceeded";
                String message = String.format("Budget Exceeded: Spending for trip '%s' has reached 100%% of total budget.", trip.getTitle());
                for (User recipient : recipientMap.values()) {
                    String dedupeKey = String.format("BUDGET_ALERT:trip-%d:100:user-%d", trip.getId(), recipient.getId());
                    notificationService.createNotification(recipient, title, message, NotificationType.BUDGET_ALERT, dedupeKey, trip.getId(), null);
                }
            }

            // Check 80% threshold
            BigDecimal threshold80 = totalBudget.multiply(new BigDecimal("0.80"));
            if (totalSpent.compareTo(threshold80) >= 0) {
                String title = "Budget Alert";
                String message = String.format("Budget Alert: Spending for trip '%s' has reached 80%% of total budget.", trip.getTitle());
                for (User recipient : recipientMap.values()) {
                    String dedupeKey = String.format("BUDGET_ALERT:trip-%d:80:user-%d", trip.getId(), recipient.getId());
                    notificationService.createNotification(recipient, title, message, NotificationType.BUDGET_ALERT, dedupeKey, trip.getId(), null);
                }
            }
        });
    }

    // ============================================================
    // CATEGORY SUMMARY
    // ============================================================

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getCategorySummary(
            Integer tripId,
            String userEmail) {

        User user = getUserByEmail(userEmail);
        Trip trip = getTripById(tripId);

        tripAccessService.verifyAccess(trip, user);

        List<Object[]> results = expenseRepository.getCategorySummary(tripId);
        Map<String, BigDecimal> summary = new LinkedHashMap<>();

        for (Object[] row : results) {
            String category = (String) row[0];
            BigDecimal total = (BigDecimal) row[1];
            summary.put(category, total);
        }

        return summary;
    }

    // ============================================================
    // REMAINING BUDGET
    // ============================================================

    @Transactional(readOnly = true)
    public BigDecimal getRemainingBudget(
            Integer tripId,
            String userEmail) {

        User user = getUserByEmail(userEmail);
        Trip trip = getTripById(tripId);

        tripAccessService.verifyAccess(trip, user);

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new RuntimeException("Budget not found for trip: " + tripId));

        BigDecimal totalExpenses = expenseRepository.getTotalExpensesByTripId(tripId);
        if (totalExpenses == null) {
            totalExpenses = BigDecimal.ZERO;
        }

        return budget.getTotalBudget().subtract(totalExpenses);
    }

    // ============================================================
    // VALIDATIONS
    // ============================================================

    private void validateCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            throw new IllegalArgumentException("Expense category is required");
        }
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Expense amount is required");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Expense amount must be greater than zero");
        }
    }

    private void validatePayerConnection(User payer, Trip trip) {
        if (tripAccessService.hasAccess(trip, payer)) {
            return;
        }
        throw new IllegalArgumentException("Payer is not connected to this trip");
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private User getUserById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payer not found with id: " + id));
    }

    private Trip getTripById(Integer id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
    }

    private Budget getBudgetById(Integer id) {
        return budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found with id: " + id));
    }

    private Expense getExpense(Integer id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
    }

    private void verifyBudgetBelongsToTrip(Budget budget, Trip trip) {
        if (budget.getTrip() == null || budget.getTrip().getId() == null ||
                !budget.getTrip().getId().equals(trip.getId())) {
            throw new IllegalArgumentException("Budget does not belong to this trip");
        }
    }
}