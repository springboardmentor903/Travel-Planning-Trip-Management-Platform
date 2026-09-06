package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AuthResponse;
import com.tripnest.tripnest_backend.dto.LoginRequest;
import com.tripnest.tripnest_backend.dto.RegisterRequest;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final String DEFAULT_ROLE = "TRAVELER";

    public AuthResponse registerUser(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered: " + request.getEmail());
        }

        Role defaultRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new RuntimeException(
                        "Default role not found. Make sure roles are seeded."));

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(defaultRole);
        user.setOauthGoogle(false);

        User savedUser = userRepository.save(user);

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole() != null ? savedUser.getRole().getName() : "TRAVELER",
                "User registered successfully",
                null
        );
    }

    public AuthResponse loginUser(LoginRequest request) {

        System.out.println("========== LOGIN DEBUG ==========");
        System.out.println("Email received: " + request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        );

        if (!passwordMatches) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        String roleName = user.getRole() != null ? user.getRole().getName() : "TRAVELER";

        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                roleName,
                "Login successful",
                token
        );
    }

    public com.tripnest.tripnest_backend.dto.UserProfileDto getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return mapToProfileDto(user);
    }

    public com.tripnest.tripnest_backend.dto.UserProfileDto updateUserProfile(String email, com.tripnest.tripnest_backend.dto.UserProfileDto request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getTravelPreferences() != null) {
            user.setTravelPreferences(request.getTravelPreferences());
        }
        if (request.getFavoriteDestinations() != null) {
            user.setFavoriteDestinations(request.getFavoriteDestinations());
        }
        if (request.getPreferredCurrency() != null && !request.getPreferredCurrency().isBlank()) {
            user.setPreferredCurrency(request.getPreferredCurrency());
        }

        User updated = userRepository.save(user);
        return mapToProfileDto(updated);
    }

    public void changePassword(String email, com.tripnest.tripnest_backend.dto.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private com.tripnest.tripnest_backend.dto.UserProfileDto mapToProfileDto(User user) {
        String curr = user.getPreferredCurrency();
        if (curr == null || curr.isBlank()) {
            curr = "USD";
        }

        return new com.tripnest.tripnest_backend.dto.UserProfileDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().getName() : "TRAVELER",
                user.getBio(),
                user.getTravelPreferences(),
                user.getFavoriteDestinations(),
                curr,
                user.getCreatedAt()
        );
    }
}
