import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Building2 } from "lucide-react";
import IndustryBadge from "./IndustryBadge";
import FundingStageBadge from "./FundingStageBadge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FounderCard({ profile, showConnect, onConnect, isConnected, isPending }) {
  const initials = (profile.full_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <Card className="group relative overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-primary/8 via-accent/5 to-transparent" />
      <div className="relative p-6">
        <div className="flex items-start gap-4">{profile.photo_url ? <img src={profile.photo_url} alt={profile.full_name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-background shadow-md" /> : <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md">{initials}</div>}<div className="flex-1 min-w-0"><h3 className="font-semibold text-foreground truncate">{profile.full_name}</h3><div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5"><Building2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{profile.startup_name}</span></div><div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1"><MapPin className="h-3 w-3 shrink-0" /><span>{profile.location}</span></div></div></div>
        {profile.one_liner && <p className="text-sm text-muted-foreground mt-4 line-clamp-2 leading-relaxed">{profile.one_liner}</p>}
        <div className="flex flex-wrap gap-1.5 mt-4"><IndustryBadge industry={profile.industry} /><FundingStageBadge stage={profile.funding_stage} /></div>
        {profile.looking_for?.length > 0 && <div className="flex flex-wrap gap-1 mt-3">{profile.looking_for.slice(0, 3).map((item) => <span key={item} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{item}</span>)}</div>}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/60"><Link to={createPageUrl("FounderDetail") + `?id=${profile.id}`} className="flex-1"><Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">View Profile<ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Button></Link>{showConnect && <Button size="sm" disabled={isConnected || isPending} onClick={() => onConnect?.(profile)} className={isConnected ? "bg-accent/10 text-accent hover:bg-accent/10" : isPending ? "bg-muted text-muted-foreground hover:bg-muted" : "bg-primary hover:bg-primary/90 text-primary-foreground"}>{isConnected ? "Connected" : isPending ? "Pending" : "Connect"}</Button>}</div>
      </div>
    </Card>
  );
}
