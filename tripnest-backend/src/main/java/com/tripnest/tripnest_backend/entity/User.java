package com.tripnest.tripnest_backend.entity;
 
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
 
import java.time.LocalDateTime;
 
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
 
    @Column(nullable = false)
    private String name;
 
    @Column(nullable = false, unique = true)
    private String email;
 
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
 
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
 
    @Column(name = "oauth_google")
    private Boolean oauthGoogle = false;
 
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
 
    @Column(name = "travel_preferences", columnDefinition = "TEXT")
    private String travelPreferences;
 
    @Column(name = "favorite_destinations", columnDefinition = "TEXT")
    private String favoriteDestinations;

    @Column(name = "preferred_currency", length = 20)
    private String preferredCurrency = "USD";
 
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
 
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
