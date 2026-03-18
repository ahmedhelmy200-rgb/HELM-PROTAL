import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "../components/shared/EventCard";
import EmptyState from "../components/shared/EmptyState";
import CreateEventDialog from "../components/events/CreateEventDialog";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);
    const allEvents = await base44.entities.Event.list("-date");
    setEvents(allEvents);
    setLoading(false);
  };

  const handleRSVP = async (event) => {
    const attendees = event.attendees || [];
    const isAttending = attendees.includes(user.email);

    const updatedAttendees = isAttending
      ? attendees.filter((e) => e !== user.email)
      : [...attendees, user.email];

    await base44.entities.Event.update(event.id, { attendees: updatedAttendees });
    setEvents(events.map((e) => (e.id === event.id ? { ...e, attendees: updatedAttendees } : e)));
  };

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  const filterEvents = (list) =>
    list.filter((e) => {
      const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || e.event_type === typeFilter;
      return matchSearch && matchType;
    });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="rounded-xl border border-border">
              <Skeleton className="h-40" />
              <div className="p-5 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">Discover and attend founder events</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-11">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="meetup">Meetup</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            <SelectItem value="pitch_night">Pitch Night</SelectItem>
            <SelectItem value="networking">Networking</SelectItem>
            <SelectItem value="conference">Conference</SelectItem>
            <SelectItem value="webinar">Webinar</SelectItem>
            <SelectItem value="hackathon">Hackathon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming ({filterEvents(upcoming).length})</TabsTrigger>
          <TabsTrigger value="past">Past ({filterEvents(past).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {filterEvents(upcoming).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filterEvents(upcoming).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRSVP={handleRSVP}
                  isAttending={event.attendees?.includes(user.email)}
                  userEmail={user.email}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No upcoming events"
              description="Be the first to create an event for the founder community"
              action={<Button onClick={() => setShowCreate(true)}>Create Event</Button>}
            />
          )}
        </TabsContent>

        <TabsContent value="past">
          {filterEvents(past).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filterEvents(past).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isAttending={event.attendees?.includes(user.email)}
                  userEmail={user.email}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Calendar} title="No past events" description="Events that have ended will appear here" />
          )}
        </TabsContent>
      </Tabs>

      <CreateEventDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        user={user}
        onCreated={loadData}
      />
    </div>
  );
}