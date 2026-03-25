import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Video } from "lucide-react";
import { format } from "date-fns";
import IndustryBadge from "./IndustryBadge";

const eventTypeLabels = { meetup: "Meetup", workshop: "Workshop", pitch_night: "Pitch Night", networking: "Networking", conference: "Conference", webinar: "Webinar", hackathon: "Hackathon" };

export default function EventCard({ event, onRSVP, isAttending }) {
  const attendeeCount = event.attendees?.length || 0;
  const isFull = event.max_attendees && attendeeCount >= event.max_attendees;
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  return (
    <Card className="group overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {event.image_url && <div className="h-40 overflow-hidden"><img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3"><Badge className="bg-primary/10 text-primary border-0 text-xs font-medium">{eventTypeLabels[event.event_type] || event.event_type}</Badge>{event.is_virtual && <Badge variant="outline" className="text-xs border-accent/30 text-accent"><Video className="h-3 w-3 mr-1" />Virtual</Badge>}{isPast && <Badge variant="outline" className="text-xs text-muted-foreground">Past</Badge>}</div>
        <h3 className="font-semibold text-foreground text-lg leading-snug">{event.title}</h3>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground"><div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-primary" /><span>{format(eventDate, "EEE, MMM d · h:mm a")}</span></div><div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /><span className="truncate">{event.location}</span></div><div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-primary" /><span>{attendeeCount} attending{event.max_attendees && ` · ${event.max_attendees - attendeeCount} spots left`}</span></div></div>
        {event.industry_focus && event.industry_focus !== "general" && <div className="mt-3"><IndustryBadge industry={event.industry_focus} /></div>}
        {event.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{event.description}</p>}
        <div className="mt-4 pt-4 border-t border-border/60">{!isPast ? <Button className={isAttending ? "w-full bg-accent/10 text-accent hover:bg-accent/20" : "w-full bg-primary hover:bg-primary/90 text-primary-foreground"} size="sm" disabled={isFull && !isAttending} onClick={() => onRSVP?.(event)}>{isAttending ? "✓ Attending" : isFull ? "Event Full" : "RSVP"}</Button> : <Button variant="outline" size="sm" className="w-full" disabled>Event Ended</Button>}</div>
      </div>
    </Card>
  );
}
