"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import { Trip, Destination, Itinerary, Activity, WeatherInfo, Budget, Expense, TripMember, JoinRequest, UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  PlusCircle,
  PieChart as PieIcon,
  Wallet,
  Receipt,
  Tag,
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Check,
  UserX,
  Mail,
  Send,
  CheckCircle2,
} from "lucide-react";

ChartJS.register(ArcElement, ChartTooltip, ChartLegend, CategoryScale, LinearScale, BarElement);

const CATEGORY_OPTIONS = [
  "Transportation",
  "Hotel",
  "Food",
  "Shopping",
  "Entertainment",
  "Miscellaneous",
];

export default function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});
  const [members, setMembers] = useState<TripMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Day State
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [dayDate, setDayDate] = useState<string>("");
  const [addingDay, setAddingDay] = useState(false);

  // Activity Modal State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activeItineraryId, setActiveItineraryId] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityType, setActivityType] = useState("Sightseeing");
  const [activityName, setActivityName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);

  // Budget Form State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState("");
  const [currencyInput, setCurrencyInput] = useState("USD");
  const [savingBudget, setSavingBudget] = useState(false);

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseCategory, setExpenseCategory] = useState("Transportation");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseReceiptLink, setExpenseReceiptLink] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  // Member Management & Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "GROUP_ADMIN">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Member Removal Confirmation Modal State
  const [memberToRemove, setMemberToRemove] = useState<TripMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/user/profile");
      setCurrentUser(res.data);
    } catch (e) {
      console.log("Could not fetch current user profile:", e);
    }
  };

  const getEffectiveDestination = (t: Trip | null): Destination | null => {
    if (!t) return null;
    if (t.destination && (t.destination.id || t.destination.name)) {
      return t.destination;
    }
    if (t.destinationName || t.destinationId) {
      return {
        id: t.destinationId || 0,
        name: t.destinationName || "",
        country: t.destinationCountry || "",
        description: "",
        weatherInfo: "",
        isPopular: false,
      };
    }
    return null;
  };

  const fetchTripDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const tripRes = await api.get(`/trips/${id}`);
      const rawTrip: Trip = tripRes.data;
      const effectiveDest = getEffectiveDestination(rawTrip);
      const tripWithDest = { ...rawTrip, destination: effectiveDest };
      setTrip(tripWithDest);

      // Fetch itineraries for this trip
      const itinRes = await api.get(`/itineraries/trip/${id}`);
      const fetchedItin: Itinerary[] = Array.isArray(itinRes.data) ? itinRes.data : [];

      const itinWithActivities = await Promise.all(
        fetchedItin.map(async (itin) => {
          try {
            const actRes = await api.get(`/activities/itinerary/${itin.id}`);
            return { ...itin, activities: Array.isArray(actRes.data) ? actRes.data : [] };
          } catch (e) {
            return { ...itin, activities: [] };
          }
        })
      );

      itinWithActivities.sort((a, b) => a.dayNumber - b.dayNumber);
      setItineraries(itinWithActivities);

      const nextDay = itinWithActivities.length > 0 ? Math.max(...itinWithActivities.map((i) => i.dayNumber)) + 1 : 1;
      setDayNumber(nextDay);
      if (tripRes.data.startDate) {
        setDayDate(tripRes.data.startDate);
      }

      // Fetch weather if destination exists
      if (effectiveDest?.id) {
        try {
          const wRes = await api.get(`/destinations/${effectiveDest.id}/weather`);
          setWeather(wRes.data);
        } catch (we) {}
      }

      fetchBudgetAndExpenses();
      fetchMembersAndJoinRequests();
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load trip details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetAndExpenses = async () => {
    try {
      const budgetRes = await api.get(`/budgets/trip/${id}`).catch(() => null);
      if (budgetRes?.data) {
        setBudget(budgetRes.data);
        setTotalBudgetInput(budgetRes.data.totalBudget?.toString() || "");
        setCurrencyInput(budgetRes.data.currency || "USD");
      }

      const expRes = await api.get(`/expenses/trip/${id}`).catch(() => null);
      if (expRes?.data && Array.isArray(expRes.data)) {
        setExpenses(expRes.data);
      }

      const summaryRes = await api.get(`/expenses/trip/${id}/category-summary`).catch(() => null);
      if (summaryRes?.data) {
        setCategorySummary(summaryRes.data);
      }
    } catch (e) {
      console.log("Error fetching budget or expenses:", e);
    }
  };

  const fetchMembersAndJoinRequests = async () => {
    try {
      const memRes = await api.get(`/trips/${id}/members`).catch(() => null);
      if (memRes?.data && Array.isArray(memRes.data)) {
        setMembers(memRes.data);
      }

      const reqRes = await api.get(`/trips/${id}/join-requests`).catch(() => null);
      if (reqRes?.data && Array.isArray(reqRes.data)) {
        setJoinRequests(reqRes.data);
      }
    } catch (e) {
      console.log("Error fetching members or join requests:", e);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchTripDetails();
  }, [id]);

  // Determine current user's role on this trip
  const isOwner = currentUser?.id === trip?.ownerId || currentUser?.email === members.find(m => m.id === 0)?.userEmail;
  const userMemberObj = members.find((m) => m.userId === currentUser?.id || m.userEmail === currentUser?.email);
  const isGroupAdmin = userMemberObj?.role === "GROUP_ADMIN" || isOwner || currentUser?.role === "ADMINISTRATOR";

  // Handle Add Day
  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayDate) return;
    setAddingDay(true);

    try {
      await api.post(`/itineraries?tripId=${id}&dayNumber=${dayNumber}&dayDate=${dayDate}`);
      setShowAddDayModal(false);
      fetchTripDetails();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to add itinerary day."));
    } finally {
      setAddingDay(false);
    }
  };

  // Handle Delete Day
  const handleDeleteDay = async (itinId: number) => {
    if (!confirm("Are you sure you want to delete this itinerary day and its activities?")) return;

    try {
      await api.delete(`/itineraries/${itinId}`);
      setItineraries((prev) => prev.filter((i) => i.id !== itinId));
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to delete itinerary day."));
    }
  };

  // Activity Modals
  const openAddActivityModal = (itinId: number) => {
    setActiveItineraryId(itinId);
    setEditingActivity(null);
    setActivityType("Sightseeing");
    setActivityName("");
    setStartTime("");
    setLocation("");
    setCost("");
    setShowActivityModal(true);
  };

  const openEditActivityModal = (itinId: number, activity: Activity) => {
    setActiveItineraryId(itinId);
    setEditingActivity(activity);
    setActivityType(activity.activityType || "Sightseeing");
    setActivityName(activity.name || "");
    setStartTime(activity.startTime ? activity.startTime.substring(0, 5) : "");
    setLocation(activity.location || "");
    setCost(activity.cost ? activity.cost.toString() : "");
    setShowActivityModal(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim() || !activeItineraryId) return;

    setSavingActivity(true);

    const queryParams = new URLSearchParams();
    queryParams.append("activityType", activityType);
    queryParams.append("name", activityName);
    if (startTime) queryParams.append("startTime", startTime.length === 5 ? `${startTime}:00` : startTime);
    if (location) queryParams.append("location", location);
    if (cost) queryParams.append("cost", cost);

    try {
      if (editingActivity) {
        await api.put(`/activities/${editingActivity.id}?${queryParams.toString()}`);
      } else {
        queryParams.append("itineraryId", activeItineraryId.toString());
        await api.post(`/activities?${queryParams.toString()}`);
      }

      setShowActivityModal(false);
      fetchTripDetails();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to save activity."));
    } finally {
      setSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      await api.delete(`/activities/${activityId}`);
      fetchTripDetails();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to delete activity."));
    }
  };

  // Budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalBudgetInput || parseFloat(totalBudgetInput) <= 0) {
      alert("Budget must be greater than zero.");
      return;
    }
    setSavingBudget(true);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("tripId", id);
      queryParams.append("totalBudget", totalBudgetInput);
      queryParams.append("currency", currencyInput);

      const res = await api.post(`/budgets?${queryParams.toString()}`);
      setBudget(res.data);
      setShowBudgetModal(false);
      fetchBudgetAndExpenses();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to update budget."));
    } finally {
      setSavingBudget(false);
    }
  };

  // Expenses
  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseCategory("Transportation");
    setExpenseAmount("");
    setExpenseDate(trip?.startDate || new Date().toISOString().substring(0, 10));
    setExpenseReceiptLink("");
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (exp: Expense) => {
    setEditingExpense(exp);
    setExpenseCategory(exp.category || "Transportation");
    setExpenseAmount(exp.amount?.toString() || "");
    setExpenseDate(exp.expenseDate || "");
    setExpenseReceiptLink(exp.receiptLink || "");
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert("Expense amount must be greater than 0.");
      return;
    }

    setSavingExpense(true);

    const queryParams = new URLSearchParams();
    queryParams.append("category", expenseCategory);
    queryParams.append("amount", expenseAmount);
    if (expenseDate) queryParams.append("expenseDate", expenseDate);
    if (expenseReceiptLink) queryParams.append("receiptLink", expenseReceiptLink);

    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}?${queryParams.toString()}`);
      } else {
        await api.post(`/trips/${id}/expenses?${queryParams.toString()}`);
      }

      setShowExpenseModal(false);
      fetchBudgetAndExpenses();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to save expense."));
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expId: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await api.delete(`/expenses/${expId}`);
      fetchBudgetAndExpenses();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to delete expense."));
    }
  };

  // Invite Member Flow
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      await api.post(`/trips/${id}/members?email=${encodeURIComponent(inviteEmail.trim())}&role=${inviteRole}`);
      setInviteSuccess(`Successfully added ${inviteEmail.trim()} as ${inviteRole === "GROUP_ADMIN" ? "Group Admin" : "Member"}!`);
      setInviteEmail("");
      fetchMembersAndJoinRequests();
    } catch (err: any) {
      setInviteError(getErrorMessage(err, "Failed to invite member. Please verify the email address."));
    } finally {
      setInviting(false);
    }
  };

  // Update Member Role
  const handleRoleChange = async (targetUserId: number, newRole: "MEMBER" | "GROUP_ADMIN") => {
    try {
      await api.put(`/trips/${id}/members/${targetUserId}/role?role=${newRole}`);
      fetchMembersAndJoinRequests();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to update member role."));
    }
  };

  // Remove Member
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemovingMember(true);

    try {
      await api.delete(`/trips/${id}/members/${memberToRemove.userId}`);
      setMemberToRemove(null);
      fetchMembersAndJoinRequests();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to remove member."));
    } finally {
      setRemovingMember(false);
    }
  };

  // Respond to Join Request (Approve / Reject)
  const handleJoinResponse = async (requestId: number, status: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/trips/${id}/join-requests/${requestId}/respond?status=${status}`);
      fetchMembersAndJoinRequests();
    } catch (err: any) {
      alert(getErrorMessage(err, `Failed to ${status.toLowerCase()} join request.`));
    }
  };

  // Chart Data
  const chartCategories = Object.keys(categorySummary);
  const chartAmounts = Object.values(categorySummary);

  const pieChartData = {
    labels: chartCategories.length > 0 ? chartCategories : ["No Expenses"],
    datasets: [
      {
        label: "Spending ($)",
        data: chartAmounts.length > 0 ? chartAmounts : [1],
        backgroundColor: [
          "#0B132B",
          "#3B1F5C",
          "#D4AF37",
          "#176B55",
          "#C58A00",
          "#8B2635",
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-[#7A6F5A] py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0B132B]" />
            <p className="text-xs">Loading trip details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
          <div className="bg-[#8B2635]/10 border border-[#8B2635]/30 rounded-2xl p-6 text-[#8B2635] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#8B2635]" />
              <span>{error || "Trip not found or access denied."}</span>
            </div>
            <Link href="/trips" className="underline font-bold">Back to Trips</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const curr = budget?.currency || "USD";
  const totalBudgetValue = budget?.totalBudget || 0;
  const totalSpentValue = budget?.totalSpent || expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const remainingBudgetValue = budget?.remainingBudget !== undefined ? budget.remainingBudget : totalBudgetValue - totalSpentValue;
  const spentRatio = totalBudgetValue > 0 ? (totalSpentValue / totalBudgetValue) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/trips"
              className="p-2 rounded-xl bg-[#FFFCF5] border border-[#E3D8BC] shadow-sm hover:bg-[#0B132B] hover:text-[#FFFCF5] transition text-[#7A6F5A]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#0B132B]">{trip.title}</h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#3B1F5C]/15 text-[#3B1F5C] border border-[#3B1F5C]/30">
                  {trip.status}
                </span>
              </div>
              {trip.destination && (
                <div className="flex items-center gap-1 text-xs text-[#7A6F5A] font-semibold mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{trip.destination.name}, {trip.destination.country}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGroupAdmin && (
              <Link
                href={`/trips/${trip.id}/edit`}
                className="inline-flex items-center gap-1.5 bg-[#FFFCF5] border border-[#E3D8BC] hover:border-[#D4AF37] text-[#0B132B] px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Edit Trip
              </Link>
            )}
          </div>
        </div>

        {/* Trip Overview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FFFCF5] p-6 rounded-2xl border border-[#E3D8BC] shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#0B132B] text-[#FFFCF5] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider">Travel Dates</span>
                <p className="text-xs font-bold text-[#3B1F5C]">{trip.startDate} — {trip.endDate}</p>
              </div>
            </div>
            <p className="text-[11px] text-[#7A6F5A] pt-2 border-t border-[#E3D8BC]">
              Total Days: <strong className="text-[#0B132B]">{itineraries.length} Days</strong>
            </p>
          </div>

          <div className="bg-[#FFFCF5] p-6 rounded-2xl border border-[#E3D8BC] shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3B1F5C] text-[#FFFCF5] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider">Destination</span>
                <p className="text-xs font-bold text-[#0B132B]">
                  {trip.destination ? `${trip.destination.name}, ${trip.destination.country}` : "Unspecified Destination"}
                </p>
              </div>
            </div>
            {trip.destination && (
              <Link
                href={`/destinations/${trip.destination.id}`}
                className="text-[11px] font-bold text-[#0B132B] hover:text-[#3B1F5C] hover:underline pt-2 border-t border-[#E3D8BC] inline-block"
              >
                View Destination Details & Weather →
              </Link>
            )}
          </div>

          {/* Weather Widget Card in Royal Navy #0B132B */}
          <div className="bg-[#0B132B] text-[#FFFCF5] p-6 rounded-2xl border border-[#3B1F5C] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Live Destination Weather</span>
                <p className="text-xl font-black mt-1 text-[#FFFCF5]">
                  {weather ? `${weather.temperature}°C` : trip.destination?.weatherInfo || "22°C"}
                </p>
                <p className="text-xs font-semibold text-[#D4AF37]">
                  {weather ? weather.condition : "Sunny & Clear"}
                </p>
              </div>
              <div className="text-3xl">{weather?.weatherIcon || "🌤️"}</div>
            </div>
            <div className="text-[10px] text-[#E5E0D5] pt-2 border-t border-[#3B1F5C] flex justify-between">
              <span>Wind: {weather?.windSpeed || 12} km/h</span>
              <span>Updated: {weather?.lastUpdated ? weather.lastUpdated.substring(11, 16) : "Live"}</span>
            </div>
          </div>
        </div>

        {/* MEMBERS & INVITE SECTION */}
        <section className="bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3D8BC] pb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B132B] flex items-center gap-2">
                <Users className="w-6 h-6 text-[#0B132B]" /> Trip Members ({members.length})
              </h2>
              <p className="text-xs text-[#7A6F5A] mt-0.5 font-medium">
                Everyone collaborating on this trip. Regular members can view members; Group Admins & Owners can invite and manage roles.
              </p>
            </div>

            {isGroupAdmin && (
              <button
                onClick={() => {
                  setInviteError(null);
                  setInviteSuccess(null);
                  setShowInviteModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition"
              >
                <UserPlus className="w-4 h-4 text-[#D4AF37]" /> Invite Member
              </button>
            )}
          </div>

          {/* Pending Join Requests (Visible to Group Admin / Owner) */}
          {isGroupAdmin && joinRequests.length > 0 && (
            <div className="bg-[#F8F4E8] border border-[#E3D8BC] p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-xs text-[#0B132B] flex items-center gap-2 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-[#C58A00]" /> Pending Join Requests ({joinRequests.length})
              </h3>
              <div className="space-y-2">
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#FFFCF5] p-3.5 rounded-xl border border-[#E3D8BC] shadow-2xs flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#0B132B]">{req.userName}</span>
                      <span className="text-[#7A6F5A] ml-2">({req.userEmail})</span>
                      <span className="text-[10px] text-[#C58A00] bg-[#C58A00]/10 px-2 py-0.5 rounded-md ml-2 border border-[#C58A00]/30 font-semibold">
                        Requested: {req.createdAt ? req.createdAt.substring(0, 10) : "Today"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleJoinResponse(req.id, "APPROVED")}
                        className="inline-flex items-center gap-1 bg-[#176B55] hover:bg-[#176B55]/90 text-[#FFFCF5] px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleJoinResponse(req.id, "REJECTED")}
                        className="inline-flex items-center gap-1 bg-[#8B2635] hover:bg-[#8B2635]/90 text-[#FFFCF5] px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => {
              const isTripOwner = m.id === 0 || m.userId === trip.ownerId;
              return (
                <div
                  key={`member-${m.userId}-${m.userEmail}`}
                  className="bg-[#F8F4E8]/60 p-4 rounded-2xl border border-[#E3D8BC] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0B132B] text-[#D4AF37] font-extrabold flex items-center justify-center text-sm shadow-2xs">
                      {m.userName ? m.userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#0B132B] flex items-center gap-1.5">
                        {m.userName}
                        {isTripOwner ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#0B132B] border border-[#D4AF37]/40 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#D4AF37]" /> Owner
                          </span>
                        ) : m.role === "GROUP_ADMIN" ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#3B1F5C]/15 text-[#3B1F5C] border border-[#3B1F5C]/30">
                            Group Admin
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#F8F4E8] text-[#7A6F5A] border border-[#E3D8BC]">
                            Member
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-[#7A6F5A] mt-0.5">{m.userEmail}</p>
                    </div>
                  </div>

                  {/* Role change & Remove controls for Group Admin / Owner */}
                  {isGroupAdmin && !isTripOwner && m.userId !== currentUser?.id && (
                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.userId, e.target.value as "MEMBER" | "GROUP_ADMIN")}
                        className="text-[11px] bg-[#FFFFFF] border border-[#D8CCAE] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-semibold text-[#1C1C1C]"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="GROUP_ADMIN">Group Admin</option>
                      </select>
                      <button
                        onClick={() => setMemberToRemove(m)}
                        className="p-1.5 text-[#7A6F5A] hover:text-[#8B2635] rounded-lg transition"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BUDGET & EXPENSE MANAGEMENT SECTION */}
        <section className="bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3D8BC] pb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B132B] flex items-center gap-2">
                <Wallet className="w-6 h-6 text-[#3B1F5C]" /> Trip Budget & Expense Tracker
              </h2>
              <p className="text-xs text-[#7A6F5A] mt-0.5 font-medium">
                Set travel budgets, log category expenses, and view remaining balance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBudgetModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition"
              >
                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                {budget ? "Edit Budget" : "Set Budget"}
              </button>
              <button
                onClick={openAddExpenseModal}
                className="inline-flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4 text-[#0B132B]" /> Add Expense
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Allocated Budget: Royal Purple #3B1F5C */}
            <div className="bg-[#F8F4E8] p-6 rounded-2xl border border-[#E3D8BC] space-y-1">
              <span className="text-[10px] font-extrabold text-[#7A6F5A] uppercase tracking-wider block">Total Allocated Budget</span>
              <div className="text-2xl font-black text-[#3B1F5C]">
                {curr} ${totalBudgetValue.toFixed(2)}
              </div>
            </div>

            {/* Actual Spending: Royal Navy #0B132B */}
            <div className="bg-[#F8F4E8] p-6 rounded-2xl border border-[#E3D8BC] space-y-1">
              <span className="text-[10px] font-extrabold text-[#7A6F5A] uppercase tracking-wider block">Total Expenses Spent</span>
              <div className="text-2xl font-black text-[#0B132B]">
                {curr} ${totalSpentValue.toFixed(2)}
              </div>
            </div>

            {/* Budget Balance Status Badges */}
            <div
              className={`p-6 rounded-2xl border space-y-1 ${
                spentRatio > 1.0
                  ? "bg-[#8B2635]/10 border-[#8B2635]/30 text-[#8B2635]"
                  : spentRatio >= 0.8
                  ? "bg-[#C58A00]/10 border-[#C58A00]/30 text-[#C58A00]"
                  : "bg-[#176B55]/10 border-[#176B55]/30 text-[#176B55]"
              }`}
            >
              <span className="text-[10px] font-extrabold text-[#7A6F5A] uppercase tracking-wider block">
                {spentRatio > 1.0 ? "Budget Exceeded Alert!" : spentRatio >= 0.8 ? "80% Threshold Alert" : "Remaining Budget Balance"}
              </span>
              <div className={`text-2xl font-black ${spentRatio > 1.0 ? "text-[#8B2635]" : spentRatio >= 0.8 ? "text-[#C58A00]" : "text-[#176B55]"}`}>
                {curr} ${remainingBudgetValue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Chart & Expense List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
            <div className="bg-[#F8F4E8] p-6 rounded-2xl border border-[#E3D8BC] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-full flex items-center justify-between border-b border-[#E3D8BC] pb-3">
                <h3 className="font-bold text-sm text-[#0B132B] flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-[#D4AF37]" /> Expense Category Chart
                </h3>
                <span className="text-[10px] font-bold text-[#0B132B] bg-[#FFFCF5] px-2 py-0.5 rounded-full border border-[#E3D8BC]">Real-time</span>
              </div>

              {chartCategories.length === 0 ? (
                <div className="py-10 text-xs text-[#7A6F5A] italic">
                  No category spending data available. Add expenses to generate the chart.
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto">
                  <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-3">
                <h3 className="font-bold text-sm text-[#0B132B] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#0B132B]" /> Logged Expenses ({expenses.length})
                </h3>
              </div>

              {expenses.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-[#E3D8BC] rounded-2xl bg-[#F8F4E8] text-xs text-[#7A6F5A]">
                  No expenses logged yet. Click "+ Add Expense" to record costs for transportation, hotel, food, etc.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 bg-[#FFFCF5] rounded-2xl border border-[#E3D8BC] shadow-2xs hover:border-[#D4AF37] transition flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0B132B] text-[#D4AF37] font-bold flex items-center justify-center">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#1C1C1C]">{exp.category}</span>
                            {exp.payer && (
                              <span className="text-[10px] text-[#7A6F5A] bg-[#F8F4E8] px-2 py-0.5 rounded-md border border-[#E3D8BC]">
                                Payer: {exp.payer.name}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#7A6F5A] block mt-0.5">{exp.expenseDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-sm text-[#0B132B]">
                          {curr} ${exp.amount?.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditExpenseModal(exp)}
                            className="p-1.5 text-[#7A6F5A] hover:text-[#0B132B] rounded transition"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-[#7A6F5A] hover:text-[#8B2635] rounded transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ITINERARY AND ACTIVITY FRONTEND SECTION */}
        <section className="bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3D8BC] pb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B132B] flex items-center gap-2">
                <span>🗓️</span> Trip Itinerary & Activities
              </h2>
              <p className="text-xs text-[#7A6F5A] mt-0.5 font-medium">
                Organize your schedule day-by-day and add planned activities
              </p>
            </div>

            <button
              onClick={() => setShowAddDayModal(true)}
              className="inline-flex items-center gap-2 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
              Add New Day to Itinerary
            </button>
          </div>

          {/* List of Itinerary Days */}
          {itineraries.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[#E3D8BC] rounded-2xl bg-[#F8F4E8]">
              <Calendar className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
              <h4 className="font-bold text-[#0B132B] text-sm">No Itinerary Days Added Yet</h4>
              <p className="text-xs text-[#7A6F5A] mb-4 max-w-sm mx-auto">
                Start structuring your journey by adding day 1 of your trip!
              </p>
              <button
                onClick={() => setShowAddDayModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition"
              >
                <Plus className="w-4 h-4 text-[#0B132B]" /> Add First Day
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {itineraries.map((itin) => (
                <div
                  key={itin.id}
                  className="border border-[#E3D8BC] rounded-2xl overflow-hidden bg-[#F8F4E8]/40 hover:border-[#D4AF37] transition"
                >
                  <div className="bg-[#F8F4E8] p-4 px-6 flex items-center justify-between border-b border-[#E3D8BC]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0B132B] text-[#FFFCF5] font-extrabold flex items-center justify-center text-xs">
                        {itin.dayNumber}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#0B132B]">Day {itin.dayNumber}</h3>
                        <p className="text-[11px] font-semibold text-[#3B1F5C]">{itin.dayDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddActivityModal(itin.id)}
                        className="inline-flex items-center gap-1 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Add Activity
                      </button>
                      <button
                        onClick={() => handleDeleteDay(itin.id)}
                        className="p-1.5 text-[#7A6F5A] hover:text-[#8B2635] hover:bg-[#8B2635]/10 rounded-lg transition"
                        title="Delete Day"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {!itin.activities || itin.activities.length === 0 ? (
                      <p className="text-xs text-[#7A6F5A] italic text-center py-2">
                        No activities planned for Day {itin.dayNumber}. Click "+ Add Activity" to schedule events.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {itin.activities.map((act) => (
                          <div
                            key={act.id}
                            className="bg-[#FFFCF5] p-4 rounded-xl border border-[#E3D8BC] shadow-sm hover:border-[#D4AF37] transition flex flex-col justify-between gap-3 group"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <span className="bg-[#3B1F5C]/15 text-[#3B1F5C] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#3B1F5C]/30">
                                  {act.activityType || "Activity"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditActivityModal(itin.id, act)}
                                    className="p-1 text-[#7A6F5A] hover:text-[#0B132B] rounded transition"
                                    title="Edit Activity"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteActivity(act.id)}
                                    className="p-1 text-[#7A6F5A] hover:text-[#8B2635] rounded transition"
                                    title="Delete Activity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h4 className="font-bold text-sm text-[#0B132B] mb-2">{act.name}</h4>

                              <div className="space-y-1 text-xs text-[#7A6F5A]">
                                {act.startTime && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    <span>Time: {act.startTime.substring(0, 5)}</span>
                                  </div>
                                )}
                                {act.location && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#0B132B]" />
                                    <span className="truncate">{act.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {act.cost !== undefined && act.cost !== null && (
                              <div className="pt-2 border-t border-[#E3D8BC] flex items-center justify-between text-xs font-semibold text-[#1C1C1C]">
                                <span>Estimated Cost</span>
                                <span className="text-[#176B55] font-bold">${act.cost}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL: INVITE MEMBER */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFCF5] border border-[#E3D8BC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-3">
              <h3 className="font-bold text-base text-[#0B132B] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0B132B]" /> Invite Member to Trip
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-[#7A6F5A] hover:text-[#0B132B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess && (
              <div className="p-3 bg-[#176B55]/10 border border-[#176B55]/30 text-[#176B55] rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#176B55]" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            {inviteError && (
              <div className="p-3 bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#8B2635]" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">User Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. traveler@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                  />
                </div>
                <p className="text-[10px] text-[#7A6F5A] mt-1">
                  Enter the email address of a registered TripNest user.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Role Permission</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "GROUP_ADMIN")}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C] font-medium"
                >
                  <option value="MEMBER">Member (Can view & manage itinerary, activities, expenses)</option>
                  <option value="GROUP_ADMIN">Group Admin (Can also invite members & manage roles)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 bg-[#F8F4E8] hover:bg-[#E3D8BC] text-[#0B132B] font-semibold rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-2 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5 text-[#D4AF37]" /> Add Member</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MEMBER REMOVAL CONFIRMATION */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFCF5] border border-[#E3D8BC] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#8B2635]/10 text-[#8B2635] flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0B132B]">Remove Member</h3>
              <p className="text-xs text-[#7A6F5A] mt-1">
                Are you sure you want to remove <strong>{memberToRemove.userName}</strong> ({memberToRemove.userEmail}) from this trip?
              </p>
            </div>

            <div className="pt-2 flex gap-3 text-xs">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2 bg-[#F8F4E8] hover:bg-[#E3D8BC] text-[#0B132B] font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={removingMember}
                className="flex-1 py-2 bg-[#8B2635] hover:bg-[#8B2635]/90 text-[#FFFCF5] font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {removingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUDGET SETTINGS */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFCF5] border border-[#E3D8BC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-3">
              <h3 className="font-bold text-base text-[#0B132B]">Set Trip Budget</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-[#7A6F5A] hover:text-[#0B132B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Total Budget Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 2500.00"
                  value={totalBudgetInput}
                  onChange={(e) => setTotalBudgetInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Currency</label>
                <select
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-2 bg-[#F8F4E8] hover:bg-[#E3D8BC] text-[#0B132B] font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="flex-1 py-2 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingBudget ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFCF5] border border-[#E3D8BC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-3">
              <h3 className="font-bold text-base text-[#0B132B]">
                {editingExpense ? "Edit Expense" : "Add New Expense"}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-[#7A6F5A] hover:text-[#0B132B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Category *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C] font-medium"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0B132B] mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0B132B] mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Receipt Link / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="https://... or Note"
                  value={expenseReceiptLink}
                  onChange={(e) => setExpenseReceiptLink(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 bg-[#F8F4E8] hover:bg-[#E3D8BC] text-[#0B132B] font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="flex-1 py-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ITINERARY DAY */}
      {showAddDayModal && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFCF5] border border-[#E3D8BC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-3">
              <h3 className="font-bold text-base text-[#0B132B]">Add New Day to Itinerary</h3>
              <button onClick={() => setShowAddDayModal(false)} className="text-[#7A6F5A] hover:text-[#0B132B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDay} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Day Number</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={dayNumber}
                  onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="flex-1 py-2 bg-[#F8F4E8] hover:bg-[#E3D8BC] text-[#0B132B] font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDay}
                  className="flex-1 py-2 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingDay ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Day"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ACTIVITY */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFCF5] border border-[#E3D8BC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-3">
              <h3 className="font-bold text-base text-[#0B132B]">
                {editingActivity ? "Edit Activity" : "Add New Activity"}
              </h3>
              <button onClick={() => setShowActivityModal(false)} className="text-[#7A6F5A] hover:text-[#0B132B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Activity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eiffel Tower Guided Tour"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Activity Category</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                >
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Dining">Dining</option>
                  <option value="Transport">Transport</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Outdoor & Adventure">Outdoor & Adventure</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Relaxation">Relaxation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0B132B] mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0B132B] mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0B132B] mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Champ de Mars, Paris"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 py-2 bg-[#F8F4E8] hover:bg-[#E3D8BC] text-[#0B132B] font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingActivity}
                  className="flex-1 py-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingActivity ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
