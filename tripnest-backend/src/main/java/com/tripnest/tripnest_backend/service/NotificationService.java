package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.NotificationResponse;
import com.tripnest.tripnest_backend.entity.Notification;
import com.tripnest.tripnest_backend.entity.NotificationType;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.NotificationRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Transactional
    public void createNotification(User recipient, String title, String message, NotificationType type, String dedupeKey, Integer tripId, Integer activityId) {
        if (recipient == null || recipient.getId() == null) {
            throw new IllegalArgumentException("Cannot create notification: recipient user is null or missing ID");
        }

        if (dedupeKey != null && !dedupeKey.isBlank()) {
            if (notificationRepository.existsByDedupeKey(dedupeKey)) {
                log.info("Duplicate notification ignored for dedupeKey: {}", dedupeKey);
                return;
            }
        }

        Notification notification = Notification.builder()
                .user(recipient)
                .title(title != null ? title : "Notification")
                .message(message)
                .type(type)
                .dedupeKey(dedupeKey)
                .tripId(tripId)
                .activityId(activityId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // Integrate with JavaMailSender for email notifications
        sendEmailNotification(recipient.getEmail(), title, message);
    }

    @Transactional
    public void createNotification(User recipient, String title, String message, NotificationType type, String dedupeKey) {
        createNotification(recipient, title, message, type, dedupeKey, null, null);
    }

    @Transactional
    public void createNotification(User recipient, String title, String message, NotificationType type) {
        createNotification(recipient, title, message, type, null, null, null);
    }

    @Transactional
    public void createNotification(User recipient, String message, NotificationType type) {
        createNotification(recipient, "Notification", message, type, null, null, null);
    }

    public void sendEmailNotification(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.isBlank() || mailSender == null) {
            return;
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(toEmail);
            mailMessage.setSubject("TripNest — " + (subject != null ? subject : "Notification"));
            mailMessage.setText(body);
            mailSender.send(mailMessage);
            log.info("Email notification sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.warn("Email dispatch to {} notice: {}", toEmail, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public NotificationResponse markAsRead(Integer id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Notification notification = notificationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Notification not found or access denied"));

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private NotificationResponse mapToResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getTitle() != null ? n.getTitle() : "Notification",
                n.getMessage(),
                n.getType(),
                n.isRead(),
                n.getCreatedAt(),
                n.getTripId(),
                n.getActivityId()
        );
    }
}
