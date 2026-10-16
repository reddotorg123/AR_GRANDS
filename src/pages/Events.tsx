import { useState } from "react";
import { Calendar, Plus, Trash2, Edit2, LogOut, LogIn } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import type { Tables } from "@/integrations/supabase/types";

type BookedEvent = Tables<"booked_events">;

const halls = ["Grand Hall (250)"];
const eventTypes = ["Wedding", "Reception", "Engagement", "Birthday Party", "Corporate Event", "Other"];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const Events = () => {
  const { isAdmin, loading: adminLoading, logout } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BookedEvent | null>(null);
  const [formData, setFormData] = useState({ event_date: "", event_type: "Wedding", hall: halls[0], status: "Booked", start_time: "", end_time: "" });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: events = [], isLoading } = useQuery({
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
        console.warn("Failed to load booked events, showing empty fallback:", err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const addMutation = useMutation({
    mutationFn: async (data: { event_date: string; event_type: string; hall: string; status: string; start_time: string; end_time: string }) => {
      const { error } = await supabase.from("booked_events").insert({
        ...data,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booked_events"] });
      toast({ title: "Booking added successfully" });
      resetForm();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; event_date: string; event_type: string; hall: string; status: string; start_time: string; end_time: string }) => {
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
      resetForm();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("booked_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booked_events"] });
      toast({ title: "Booking deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData({ event_date: "", event_type: "Wedding", hall: halls[0], status: "Booked", start_time: "", end_time: "" });
  };

  const handleEdit = (event: BookedEvent) => {
    setEditingEvent(event);
    setFormData({
      event_date: event.event_date,
      event_type: event.event_type,
      hall: event.hall,
      status: event.status,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  // Filter events by selected month
  const filteredEvents = events.filter((e) => e.event_date.startsWith(selectedMonth));

  // Generate available dates for the selected month
  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const bookedDatesMap = new Map<string, string[]>();
  filteredEvents.forEach((e) => {
    const existing = bookedDatesMap.get(e.event_date) || [];
    existing.push(e.hall);
    bookedDatesMap.set(e.event_date, existing);
  });

  const availableDates: { date: string; halls: string }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(dateStr + "T00:00:00");
    if (d < new Date(new Date().toDateString())) continue; // skip past dates
    const bookedHalls = bookedDatesMap.get(dateStr) || [];
    const allBooked = halls.every((h) => bookedHalls.includes(h));
    if (!allBooked) {
      const freeHalls = halls.filter((h) => !bookedHalls.includes(h));
      availableDates.push({
        date: dateStr,
        halls: freeHalls.length === halls.length ? "All Halls Available" : freeHalls.join(", ") + " Available",
      });
    }
  }

  // Generate month options
  const monthOptions: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  return (
    <div className="pt-20">
      <SEO
        title="Events & Date Availability · A.R Grand Marriage Hall"
        description="Check available wedding & event dates at A.R Grand Marriage Hall in Kodungaiyur, Chennai. Reserve your preferred date before it's booked."
        path="/events"
      />
      <section className="px-4 pt-4 pb-16 md:px-8 md:pt-6 md:pb-24 lg:px-16 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="heading-xl text-foreground">Events & Availability</h1>
          {!adminLoading && (
            isAdmin ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowForm(true); setEditingEvent(null); setFormData({ event_date: "", event_type: "Wedding", hall: halls[0], status: "Booked", start_time: "", end_time: "" }); }}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-body font-semibold hover:bg-primary/90 transition-colors text-sm"
                >
                  <Plus size={16} /> Add Booking
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm transition-colors"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm transition-colors"
              >
                <LogIn size={16} /> Admin
              </Link>
            )
          )}
        </div>
        <p className="text-body text-muted-foreground mb-8 max-w-2xl">
          Check our upcoming bookings and available dates. Contact us to reserve your preferred date.
        </p>

        {/* Month selector */}
        <div className="mb-8">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground font-body"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form (admin only) */}
        {isAdmin && showForm && (
          <div className="mb-8 bg-card p-6 rounded-xl border border-border">
            <h3 className="heading-md text-foreground mb-4">{editingEvent ? "Edit Booking" : "Add New Booking"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="font-body text-sm text-muted-foreground block mb-1">Date</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-body"
                />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground block mb-1">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-body"
                >
                  {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground block mb-1">Hall</label>
                <select
                  value={formData.hall}
                  onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-body"
                >
                  {halls.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground block mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-body"
                >
                  <option value="Booked">Booked</option>
                  <option value="Tentative">Tentative</option>
                </select>
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground block mb-1">Preferred Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-body"
                />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground block mb-1">Preferred End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-body"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-3">
                <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-body font-semibold hover:bg-primary/90 transition-colors">
                  {editingEvent ? "Update" : "Add"}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg border border-border text-foreground font-body hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Scheduled Bookings */}
          <div>
            <h2 className="heading-md text-foreground mb-6 flex items-center gap-2">
              <Calendar className="text-primary" size={24} />
              Scheduled Bookings — {formatMonth(selectedMonth)}
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <div className="bg-card/60 p-4 rounded-lg border border-border animate-pulse flex items-center justify-between">
                    <div className="space-y-2 w-1/2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="h-6 w-16 bg-muted rounded-full"></div>
                  </div>
                  <div className="bg-card/60 p-4 rounded-lg border border-border animate-pulse flex items-center justify-between">
                    <div className="space-y-2 w-1/2">
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-3 bg-muted rounded w-2/5"></div>
                    </div>
                    <div className="h-6 w-16 bg-muted rounded-full"></div>
                  </div>
                </div>
              ) : filteredEvents.length === 0 ? (
                <p className="text-muted-foreground font-body py-4">No bookings for this month.</p>
              ) : (
                filteredEvents.map((event) => (
                  <div key={event.id} className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="font-body font-semibold text-foreground">{event.event_type}</p>
                      <p className="font-body text-sm text-muted-foreground">{formatDate(event.event_date)} • {event.hall}{event.start_time || event.end_time ? ` • ${event.start_time?.slice(0,5) || "?"} – ${event.end_time?.slice(0,5) || "?"}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-body text-xs px-3 py-1 rounded-full font-semibold ${
                        event.status === "Booked"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {event.status}
                      </span>
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEdit(event)} className="text-muted-foreground hover:text-primary transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteMutation.mutate(event.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Dates */}
          <div>
            <h2 className="heading-md text-foreground mb-6 flex items-center gap-2">
              <Calendar className="text-primary" size={24} />
              Available Dates — {formatMonth(selectedMonth)}
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {availableDates.length === 0 ? (
                <p className="text-muted-foreground font-body py-4">No available dates this month.</p>
              ) : (
                availableDates.map((slot, i) => (
                  <div key={i} className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="font-body font-semibold text-foreground">{formatDate(slot.date)}</p>
                      <p className="font-body text-sm text-muted-foreground">{slot.halls}</p>
                    </div>
                    <span className="bg-primary/10 text-primary font-body text-xs px-3 py-1 rounded-full font-semibold">
                      Available
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;
