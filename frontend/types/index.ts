export interface Destination {
  id: number;
  name: string;
  country: string;
  description: string;
  weatherInfo: string;
  isPopular: boolean;
}

export interface WeatherInfo {
  destinationName: string;
  temperature: number;
  condition: string;
  windSpeed: number;
  humidity: number;
  weatherIcon: string;
  lastUpdated: string;
}

export interface Activity {
  id: number;
  activityType: string;
  name: string;
  startTime?: string;
  location?: string;
  cost?: number;
}

export interface Itinerary {
  id: number;
  dayNumber: number;
  dayDate: string;
  activities?: Activity[];
}

export interface Trip {
  id: number;
  title: string;
  ownerId?: number;
  ownerName?: string;
  destination: Destination | null;
  destinationId?: number;
  destinationName?: string;
  destinationCountry?: string;
  startDate: string;
  endDate: string;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED" | string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  bio?: string;
  travelPreferences?: string;
  favoriteDestinations?: string;
  preferredCurrency?: string;
  createdAt?: string;
}

export interface Budget {
  id?: number;
  totalBudget: number;
  totalSpent?: number;
  remainingBudget?: number;
  currency: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  expenseDate: string;
  receiptLink?: string;
  payer?: {
    id: number;
    name: string;
    email: string;
  };
}

export type TripRole = "MEMBER" | "GROUP_ADMIN";

export interface TripMember {
  id: number;
  tripId: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: TripRole;
  joinedAt?: string;
}

export interface JoinRequest {
  id: number;
  tripId: number;
  tripTitle: string;
  userId: number;
  userName: string;
  userEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: string;
  destinationName?: string;
  destinationCountry?: string;
  startDate?: string;
  endDate?: string;
  ownerName?: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: "MEMBER_ADDED" | "JOIN_REQUEST" | "JOIN_REQUEST_APPROVED" | "JOIN_REQUEST_REJECTED" | "TRIP_REMINDER" | "ACTIVITY_REMINDER" | "BUDGET_ALERT" | "TRAVEL_UPDATE" | "NEW_TRIP";
  read: boolean;
  createdAt: string;
  tripId?: number;
  activityId?: number;
}

export interface Attraction {
  id: number;
  name: string;
  shortDescription: string;
  destinationId: number;
}

export interface VisitedDestination {
  destinationId: number;
  destinationName: string;
  country: string;
  visitCount: number;
}

export interface TravelerDashboardData {
  upcomingTrips: Trip[];
  budgetOverview: {
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
  };
  expenseSummary: Record<string, number>;
  favoriteDestinations: string[];
  mostVisitedDestinations: VisitedDestination[];
  travelStats: {
    totalTripsTaken: number;
    uniqueDestinationsVisited: number;
    totalAmountSpent?: number;
  };
}

export interface AdminTripMember {
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface AdminTripDetail {
  id: number;
  title: string;
  destinationId?: number;
  destinationName: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  status: string;
  ownerId?: number;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  members: AdminTripMember[];
}
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AdminDashboardData {
  userAnalytics: {
    totalUsers: number;
    travelerUsers?: number;
    adminUsers?: number;
  };
  tripAnalytics: {
    totalTrips: number;
    activeTrips: number;
    completedTrips: number;
    plannedTrips: number;
    cancelledTrips?: number;
  };
  destinationAnalytics: {
    destinationId: number;
    destinationName: string;
    country: string;
    tripCount: number;
  }[];
  platformStats: {
    totalExpensesLogged: number;
    totalNotificationsSent: number;
  };
  allTrips: AdminTripDetail[];
}
