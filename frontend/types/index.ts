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
}
