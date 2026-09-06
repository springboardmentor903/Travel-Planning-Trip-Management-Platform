package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRoleName(String roleName);

    List<User> findByRole(com.tripnest.tripnest_backend.entity.Role role);
}