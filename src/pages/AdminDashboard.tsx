import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  LayoutDashboard,
  Users,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  Building2,
  CalendarCheck2,
  Inbox,
  X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import type { Tables } from "@/integrations/supabase/types";

type BookedEvent = Tables<"booked_events">;

interface LeadEnquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time?: string;
  functionType: string;
  capacity: string;
  message?: string;
  status: "New" | "Contacted" | "Confirmed" | "Cancelled";
  createdAt: string;
}

const halls = ["Grand Hall (250)"];
const eventTypes = ["Wedding", "Reception", "Engagement", "Birthday Party", "Corporate Event", "Other"];

// Sample simulated lead enquiries (supplemented with real-time localStorage sync for demo/testing)
const initialMockLeads: LeadEnquiry[] = [
  {
    id: "lead-1",
    name: "Suresh Raman",
    phone: "9840123456",
    email: "suresh.raman@gmail.com",
    date: "2026-11-15",
    time: "18:00",
    functionType: "Wedding",
    capacity: "100–250 Guests",
    message: "Looking for wedding hall with catering package for 200 guests.",
    status: "New",
    createdAt: "2026-10-16T10:30:00Z",
  },
  {
    id: "lead-2",
    name: "Kavitha Sundaram",
    phone: "9444156789",
    email: "kavitha.s@outlook.com",
    date: "2026-10-28",
    time: "10:00",
    functionType: "Reception",
    capacity: "50–100 Guests",
    message: "Morning reception slot inquiry. Please confirm AC hall availability.",
    status: "Contacted",
    createdAt: "2026-10-15T14:15:00Z",
  },
  {
    id: "lead-3",
    name: "Dr. Arvind Nathan",
    phone: "9791198765",
    email: "arvind.doc@yahoo.com",
    date: "2026-12-05",
    time: "19:00",
    functionType: "Engagement",
    capacity: "100–250 Guests",
    message: "Family engagement ceremony with stage decor and bridal suite requirement.",
    status: "Confirmed",
    createdAt: "2026-10-14T09:00:00Z",
  },
];

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading, logout } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "leads">("overview");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BookedEvent | null>(null);

  const [formData, setFormData] = useState({
    event_date: "",
    event_type: "Wedding",
    hall: halls[0],
    status: "Booked",
    start_time: "",
    end_time: "",
  });

  // Local lead inquiries state (allows admin to test lead triage)
  const [leads, setLeads] = useState<LeadEnquiry[]>(() => {
    const stored = localStorage.getItem("ar_grand_admin_leads");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return initialMockLeads;
  });

  // Fetch Bookings from Supabase
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["booked_events"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("booked_events")
          .select("*")
          .order("event_date", { ascending: true })
          .abortSignal(AbortSignal.timeout(4000));
        if (error) throw error;
        return (data || []) as BookedEvent[];
      } catch (err) {
        console.warn("Failed to load booked events, showing fallback:", err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Add Event Mutation
  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("booked_events").insert({
        ...data,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booked_events"] });
      toast({ title: "Booking created successfully" });
      closeModal();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Update Event Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const { error } = await supabase.from("booked_events").update({
        ...data,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booked_events"] });
      toast({ title: "Booking updated successfully" });
      closeModal();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Delete Event Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("booked_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booked_events"] });
      toast({ title: "Booking removed from calendar" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const closeModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setFormData({ event_date: "", event_type: "Wedding", hall: halls[0], status: "Booked", start_time: "", end_time: "" });
  };

  const openEditModal = (event: BookedEvent) => {
    setEditingEvent(event);
    setFormData({
      event_date: event.event_date,
      event_type: event.event_type,
      hall: event.hall,
      status: event.status,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
    });
    setShowEventModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event_date) {
      toast({ title: "Please pick an event date", variant: "destructive" });
      return;
    }
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const updateLeadStatus = (leadId: string, status: LeadEnquiry["status"]) => {
    const updated = leads.map((l) => (l.id === leadId ? { ...l, status } : l));
    setLeads(updated);
    localStorage.setItem("ar_grand_admin_leads", JSON.stringify(updated));
    toast({ title: "Lead status updated to " + status });
  };

  const deleteLead = (leadId: string) => {
    const updated = leads.filter((l) => l.id !== leadId);
    setLeads(updated);
    localStorage.setItem("ar_grand_admin_leads", JSON.stringify(updated));
    toast({ title: "Lead deleted" });
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged out from Admin Console" });
    navigate("/admin");
  };

  // Filtered Bookings for the selected month and search query
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchMonth = !selectedMonth || ev.event_date.startsWith(selectedMonth);
      const matchSearch =
        !searchQuery ||
        ev.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.hall.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.event_date.includes(searchQuery);
      return matchMonth && matchSearch;
    });
  }, [events, selectedMonth, searchQuery]);

  // Key Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthBookings = events.filter((e) => e.event_date.startsWith(currentMonthStr)).length;
    const totalWeddings = events.filter((e) => e.event_type === "Wedding").length;
    const newLeadsCount = leads.filter((l) => l.status === "New").length;

    return {
      totalBookings: events.length,
      thisMonthBookings,
      totalWeddings,
      newLeadsCount,
    };
  }, [events, leads]);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-foreground tracking-wider uppercase text-xs">Authenticating Admin Console...</p>
        </div>
      </div>
    );
  }

  // If not authenticated as admin, prompt login
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-20 px-4">
        <SEO title="Admin Console · A.R Grand" description="A.R Grand Venue Management Console" path="/admin" />
        <div className="max-w-md w-full bg-card p-8 rounded-xl border border-border shadow-lg text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <ShieldCheck className="text-primary" size={28} />
          </div>
          <h2 className="heading-lg text-foreground">Admin Console</h2>
          <p className="text-sm text-muted-foreground">
            You must be logged in with an authorized administrator account to access the venue management console.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/admin" className="btn-gold w-full text-center">
              Sign In to Admin Console
            </Link>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 pb-16">
      <SEO title="Admin Console · A.R Grand Venue Management" description="A.R Grand Venue Management & Bookings" path="/admin/dashboard" />

      {/* Top Header Bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center shadow-sm">
              <Building2 className="text-noir" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold text-foreground">A.R Grand Venue Console</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Bookings, Calendar Blackouts & Customer Enquiries</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/events"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-all"
              title="View Public Events Page"
            >
              <ExternalLink size={13} />
              Public Site
            </Link>
            <button
              onClick={() => {
                setEditingEvent(null);
                setFormData({ event_date: "", event_type: "Wedding", hall: halls[0], status: "Booked", start_time: "", end_time: "" });
                setShowEventModal(true);
              }}
              className="btn-gold !py-1.5 !px-3.5 !text-xs inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              New Booking
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive/30 hover:bg-destructive/10 text-destructive text-xs font-medium transition-all"
              title="Logout"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-border gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard size={14} />
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "bookings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarCheck2 size={14} />
            Bookings Calendar ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "leads"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Inbox size={14} />
            Customer Leads ({leads.length})
            {stats.newLeadsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-primary-foreground">
                {stats.newLeadsCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & STATS */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="text-primary" size={22} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Confirmed Events</p>
                  <p className="text-2xl font-heading font-bold text-foreground mt-0.5">{stats.totalBookings}</p>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <CalendarIcon className="text-amber-500" size={22} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Booked This Month</p>
                  <p className="text-2xl font-heading font-bold text-foreground mt-0.5">{stats.thisMonthBookings}</p>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                  <Users className="text-rose-500" size={22} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Weddings & Receptions</p>
                  <p className="text-2xl font-heading font-bold text-foreground mt-0.5">{stats.totalWeddings}</p>
                </div>
              </div>

              <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Inbox className="text-emerald-500" size={22} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">New Website Leads</p>
                  <p className="text-2xl font-heading font-bold text-foreground mt-0.5">{stats.newLeadsCount}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Bookings Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upcoming Events Preview */}
              <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Upcoming Venue Bookings</h3>
                    <p className="text-xs text-muted-foreground">Next celebrations scheduled on calendar</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    View All Calendar →
                  </button>
                </div>

                {eventsLoading ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Loading calendar events...</p>
                ) : events.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">No bookings recorded yet.</p>
                    <button
                      onClick={() => setShowEventModal(true)}
                      className="mt-3 btn-gold !py-1 !px-3 !text-xs inline-flex items-center gap-1"
                    >
                      <Plus size={13} />
                      Add First Booking
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {events.slice(0, 5).map((ev) => (
                      <div key={ev.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                            <span className="text-[10px] uppercase font-bold leading-none">
                              {new Date(ev.event_date + "T00:00:00").toLocaleDateString("en-IN", { month: "short" })}
                            </span>
                            <span className="text-sm font-bold leading-tight">
                              {new Date(ev.event_date + "T00:00:00").getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="font-heading text-sm font-bold text-foreground">{ev.event_type}</p>
                            <p className="text-xs text-muted-foreground">{ev.hall} • {ev.start_time || "All Day"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {ev.status}
                          </span>
                          <button
                            onClick={() => openEditModal(ev)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this booking from public calendar?")) {
                                deleteMutation.mutate(ev.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Venue Quick Contact Card */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">Venue Information</h3>
                  <p className="text-xs text-muted-foreground mb-4">Official A.R Grand contact points</p>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Phone className="text-primary shrink-0 mt-0.5" size={14} />
                      <div>
                        <p className="text-muted-foreground">Primary Hotline</p>
                        <p className="font-semibold text-foreground">+91 94440 43451 / +91 97911 65395</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Mail className="text-primary shrink-0 mt-0.5" size={14} />
                      <div>
                        <p className="text-muted-foreground">Admin Mail</p>
                        <p className="font-semibold text-foreground">info@argrand.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Building2 className="text-primary shrink-0 mt-0.5" size={14} />
                      <div>
                        <p className="text-muted-foreground">Hall Capacity</p>
                        <p className="font-semibold text-foreground">50 to 250 Guests (Fully Air-Conditioned)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <p className="text-xs font-bold text-primary">Admin Tip</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Bookings added here reflect in real-time on the public /events calendar and prevent customer double-bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS CALENDAR MANAGEMENT */}
        {activeTab === "bookings" && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by function or date..."
                    className="pl-8 pr-4 py-1.5 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-64"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Filter size={13} />
                  <span>Month:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-2 py-1 text-xs rounded-md border border-border bg-background text-foreground"
                  />
                  {selectedMonth && (
                    <button
                      onClick={() => setSelectedMonth("")}
                      className="text-xs text-primary underline ml-1"
                    >
                      Show All
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingEvent(null);
                  setFormData({ event_date: "", event_type: "Wedding", hall: halls[0], status: "Booked", start_time: "", end_time: "" });
                  setShowEventModal(true);
                }}
                className="btn-gold !py-1.5 !px-3.5 !text-xs inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                Add Event Booking
              </button>
            </div>

            {/* Bookings Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Event Date</th>
                    <th className="px-4 py-3">Function Type</th>
                    <th className="px-4 py-3">Hall</th>
                    <th className="px-4 py-3">Timing</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No bookings matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {new Date(ev.event_date + "T00:00:00").toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">{ev.event_type}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{ev.hall}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ev.start_time ? `${ev.start_time} – ${ev.end_time || ""}` : "Full Day"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 size={10} />
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(ev)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Edit Event"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete booking on ${ev.event_date}?`)) {
                                deleteMutation.mutate(ev.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Delete Event"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER LEADS & INQUIRIES */}
        {activeTab === "leads" && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground">Customer Booking Enquiries</h3>
              <p className="text-xs text-muted-foreground">Manage incoming website leads and dispatch calls</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Customer Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Function / Date</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{lead.name}</p>
                        <p className="text-[11px] text-muted-foreground">{lead.email || "No email"}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{lead.phone}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{lead.functionType}</p>
                        <p className="text-[11px] text-muted-foreground">{lead.date}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.capacity}</td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                          className="px-2 py-1 text-[11px] font-semibold rounded border border-border bg-background text-foreground"
                        >
                          <option value="New">🟡 New</option>
                          <option value="Contacted">🔵 Contacted</option>
                          <option value="Confirmed">🟢 Confirmed</option>
                          <option value="Cancelled">🔴 Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                          title="Call Customer"
                        >
                          <Phone size={12} />
                          Call
                        </a>
                        <a
                          href={`https://wa.me/91${lead.phone}?text=Hello%20${encodeURIComponent(lead.name)}%2C%20thank%20you%20for%20contacting%20A.R%20Grand%20Marriage%20Hall.`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </a>
                        <button
                          onClick={() => {
                            if (confirm(`Remove enquiry for ${lead.name}?`)) {
                              deleteLead(lead.id);
                            }
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-destructive"
                          title="Delete Lead"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* EVENT BOOKING MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-foreground">
                {editingEvent ? "Edit Venue Booking" : "New Venue Booking"}
              </h3>
              <button onClick={closeModal} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Event Date *</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Event Type *</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  >
                    {eventTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Hall *</label>
                  <select
                    value={formData.hall}
                    onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  >
                    {halls.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Start Time (Optional)</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">End Time (Optional)</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="btn-gold !py-2 !px-4 !text-xs"
                >
                  {editingEvent ? "Save Changes" : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
