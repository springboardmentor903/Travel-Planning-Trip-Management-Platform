package com.tripnest.tripnest_backend.controller;
 
import com.tripnest.tripnest_backend.dto.AdminDashboardResponse;
import com.tripnest.tripnest_backend.dto.UpdateRoleRequest;
import com.tripnest.tripnest_backend.dto.UserSummaryResponse;
import com.tripnest.tripnest_backend.service.AdminService;
import com.tripnest.tripnest_backend.service.DashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
 
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminController {
 
    private final AdminService adminService;
    private final DashboardService dashboardService;
 
    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> adminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }
 
    @GetMapping("/users")
    public List<UserSummaryResponse> listUsers() {
        return adminService.listUsers();
    }
 
    @PutMapping("/users/{id}/role")
    public UserSummaryResponse updateUserRole(@PathVariable Integer id, @Valid @RequestBody UpdateRoleRequest request) {
        return adminService.updateUserRole(id, request.getRoleName());
    }
}
