package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    // Get all expenses for a particular trip
    List<Expense> findByTripIdOrderByExpenseDateDesc(Integer tripId);

    // Calculate total expenses for a trip
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.trip.id = :tripId
            """)
    BigDecimal getTotalExpensesByTripId(@Param("tripId") Integer tripId);

    // Group expenses by category
    @Query("""
            SELECT e.category, COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.trip.id = :tripId
            GROUP BY e.category
            ORDER BY e.category
            """)
    List<Object[]> getCategorySummary(@Param("tripId") Integer tripId);

    // Calculate total expenses across all trips on platform
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM Expense e
            """)
    BigDecimal getTotalExpensesAcrossAllTrips();
}