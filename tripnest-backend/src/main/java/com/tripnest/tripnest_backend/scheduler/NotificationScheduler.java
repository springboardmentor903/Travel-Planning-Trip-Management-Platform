package com.tripnest.tripnest_backend.scheduler;

import com.tripnest.tripnest_backend.entity.*;
import com.tripnest.tripnest_backend.repository.ActivityRepository;
import com.tripnest.tripnest_backend.repository.ItineraryRepository;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final TripRepository tripRepository;
    private final ActivityRepository activityRepository;
    private final ItineraryRepository itineraryRepository;
    private final TripMemberRepository tripMemberRepository;
    private final NotificationService notificationService;

    @Value("${tripnest.reminders.trip-days-before:3}")
    private int tripDaysBefore;

    @Value("${tripnest.reminders.activity-days-before:1}")
    private int activityDaysBefore;

    @Scheduled(cron = "${tripnest.reminders.cron:0 0 9 * * *}")
    public void sendScheduledReminders() {
        log.info("Running daily scheduled notification reminders...");
        sendTripReminders();
        sendActivityReminders();
    }

    public void sendTripReminders() {
        LocalDate targetDate = LocalDate.now().plusDays(tripDaysBefore);
        List<Trip> upcomingTrips = tripRepository.findByStartDate(targetDate);

        for (Trip trip : upcomingTrips) {
            if ("CANCELLED".equalsIgnoreCase(trip.getStatus()) || "COMPLETED".equalsIgnoreCase(trip.getStatus())) {
                continue;
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

            String title = "Trip Reminder";
            String message = String.format("Reminder: Your trip '%s' starts in %d days on %s!",
                    trip.getTitle(), tripDaysBefore, trip.getStartDate());

            for (User recipient : recipientMap.values()) {
                String dedupeKey = String.format("TRIP_REMINDER:trip-%d:user-%d:%s",
                        trip.getId(), recipient.getId(), targetDate);
                notificationService.createNotification(recipient, title, message, NotificationType.TRIP_REMINDER, dedupeKey, trip.getId(), null);
            }
        }
    }

    public void sendActivityReminders() {
        LocalDate targetDate = LocalDate.now().plusDays(activityDaysBefore);
        List<Itinerary> itineraries = itineraryRepository.findByDayDate(targetDate);

        for (Itinerary itinerary : itineraries) {
            Trip trip = itinerary.getTrip();
            if (trip == null || "CANCELLED".equalsIgnoreCase(trip.getStatus()) || "COMPLETED".equalsIgnoreCase(trip.getStatus())) {
                continue;
            }

            List<Activity> activities = activityRepository.findByItineraryIdOrderByStartTimeAsc(itinerary.getId());
            if (activities == null || activities.isEmpty()) {
                continue;
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

            for (Activity activity : activities) {
                String title = "Activity Reminder";
                String message = String.format("Reminder: You have activity '%s' scheduled for %s on your trip '%s'.",
                        activity.getName(), targetDate, trip.getTitle());

                for (User recipient : recipientMap.values()) {
                    String dedupeKey = String.format("ACTIVITY_REMINDER:activity-%d:user-%d:%s",
                            activity.getId(), recipient.getId(), targetDate);
                    notificationService.createNotification(recipient, title, message, NotificationType.ACTIVITY_REMINDER, dedupeKey, trip.getId(), activity.getId());
                }
            }
        }
    }
}
