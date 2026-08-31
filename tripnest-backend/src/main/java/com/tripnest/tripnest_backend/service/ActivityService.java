package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Activity;
import com.tripnest.tripnest_backend.entity.Itinerary;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.ActivityRepository;
import com.tripnest.tripnest_backend.repository.ItineraryRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ItineraryRepository itineraryRepository;
    private final UserRepository userRepository;
    private final TripAccessService tripAccessService;

    public List<Activity> getAllActivities(String userEmail) {
        User user = getUserByEmail(userEmail);

        return activityRepository.findAll()
                .stream()
                .filter(activity -> tripAccessService.hasAccess(activity.getItinerary().getTrip(), user))
                .toList();
    }

    public Activity getActivityById(Integer id, String userEmail) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found with id: " + id));

        verifyAccess(activity.getItinerary().getTrip(), userEmail);
        return activity;
    }

    public List<Activity> getActivitiesByItineraryId(Integer itineraryId, String userEmail) {
        Itinerary itinerary = getItineraryById(itineraryId);
        verifyAccess(itinerary.getTrip(), userEmail);

        return activityRepository.findByItineraryIdOrderByStartTimeAsc(itineraryId);
    }

    public Activity createActivity(
            Integer itineraryId,
            String activityType,
            String name,
            LocalTime startTime,
            String location,
            BigDecimal cost,
            String userEmail) {

        Itinerary itinerary = getItineraryById(itineraryId);
        verifyAccess(itinerary.getTrip(), userEmail);

        Activity activity = Activity.builder()
                .itinerary(itinerary)
                .activityType(activityType)
                .name(name)
                .startTime(startTime)
                .location(location)
                .cost(cost)
                .build();

        return activityRepository.save(activity);
    }

    public Activity updateActivity(
            Integer id,
            String activityType,
            String name,
            LocalTime startTime,
            String location,
            BigDecimal cost,
            String userEmail) {

        Activity activity = getActivityById(id, userEmail);

        activity.setActivityType(activityType);
        activity.setName(name);
        activity.setStartTime(startTime);
        activity.setLocation(location);
        activity.setCost(cost);

        return activityRepository.save(activity);
    }

    public void deleteActivity(Integer id, String userEmail) {
        Activity activity = getActivityById(id, userEmail);
        activityRepository.delete(activity);
    }

    private Itinerary getItineraryById(Integer id) {
        return itineraryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Itinerary not found with id: " + id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private void verifyAccess(Trip trip, String userEmail) {
        User user = getUserByEmail(userEmail);
        tripAccessService.verifyAccess(trip, user);
    }
}