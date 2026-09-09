package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);
    
    long countByUserIdAndIsReadFalse(Integer userId);
    
    Optional<Notification> findByIdAndUserId(Integer id, Integer userId);

    boolean existsByDedupeKey(String dedupeKey);
}
