package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.AdminDashboardResponse;
import com.tripnest.tripnest_backend.dto.TravelerDashboardResponse;
import com.tripnest.tripnest_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/traveler")
    public ResponseEntity<TravelerDashboardResponse> getTravelerDashboard(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getTravelerDashboard(authentication.getName()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<AdminDashboardResponse> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }
}
