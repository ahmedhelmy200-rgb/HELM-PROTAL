import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Building2,
  Globe,
  Linkedin,
  Twitter,
  MessageSquare,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import IndustryBadge from "../components/shared/IndustryBadge";
import FundingStageBadge from "../components/shared/FundingStageBadge";
import { Skeleton } from "@/components/ui/skeleton";

export default function FounderDetail() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("id");

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);

    const [allProfiles, sentConnections, receivedConnections] = await Promise.all([
      base44.entities.FounderProfile.list(),
      base44.entities.ConnectionRequest.filter({ from_email: u.email }),
      base44.entities.ConnectionRequest.filter({ to_email: u.email }),
    ]);

    const target = allProfiles.find((p) => p.id === profileId);
    setProfile(target);
    setMyProfile(allProfiles.find((p) => p.user_email === u.email));

    if (target) {
      const sent = sentConnections.find((c) => c.to_email === target.user_email);
      const received = receivedConnections.find((c) => c.from_email === target.user_email);
      if (sent?.status === "accepted" || received?.status === "accepted") setConnectionStatus("accepted");
      else if (sent?.status === "pending") setConnectionStatus("pending_sent");
      else if (received?.status === "pending") setConnectionStatus("pending_received");
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    await base44.entities.ConnectionRequest.create({
      from_email: user.email,
      from_name: myProfile?.full_name || user.full_name,
      to_email: profile.user_email,
      to_name: profile.full_name,
      status: "pending",
    });
    setConnectionStatus("pending_sent");
  };

  const handleMessage = async () => {
    const conversations = await base44.entities.Conversation.list();
    const existing = conversations.find(
      (c) =>
        c.participants?.includes(user.email) &&
        c.participants?.includes(profile.user_email)
    );

    if (existing) {
      navigate(createPageUrl("Messages") + `?conversation=${existing.id}`);
    } else {
      const newConv = await base44.entities.Conversation.create({
        participants: [user.email, profile.user_email],
        participant_names: [myProfile?.full_name || user.full_name, profile.full_name],
      });
      navigate(createPageUrl("Messages") + `?conversation=${newConv.id}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="flex gap-6">
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-muted-foreground">Profile not found</p>
        <Link to={createPageUrl("Discover")}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discover
          </Button>
        </Link>
      </div>
    );
  }

  const initials = (profile.full_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isOwnProfile = profile.user_email === user?.email;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to={createPageUrl("Discover")}>
        <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      </Link>

      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5" />
        <div className="px-6 sm:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-card shadow-xl"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl ring-4 ring-card shadow-xl">
                {initials}
              </div>
            )}
            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{profile.startup_name}</span>
              </div>
            </div>
            {!isOwnProfile && (
              <div className="flex gap-2 sm:pb-1">
                {connectionStatus === "accepted" ? (
                  <Button variant="outline" size="sm" className="text-accent border-accent/30">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Connected
                  </Button>
                ) : connectionStatus === "pending_sent" ? (
                  <Button variant="outline" size="sm" disabled>
                    <Clock className="h-4 w-4 mr-1.5" />
                    Pending
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleConnect} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Connect
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleMessage}>
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Message
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <IndustryBadge industry={profile.industry} />
            <FundingStageBadge stage={profile.funding_stage} />
            <Badge variant="outline" className="text-xs gap-1">
              <MapPin className="h-3 w-3" />
              {profile.location}
            </Badge>
          </div>

          {profile.one_liner && (
            <p className="text-foreground font-medium mt-6 text-lg leading-relaxed">
              "{profile.one_liner}"
            </p>
          )}

          {profile.bio && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
              <p className="text-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {profile.looking_for?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Looking for</h3>
              <div className="flex flex-wrap gap-2">
                {profile.looking_for.map((item) => (
                  <Badge key={item} variant="secondary" className="text-sm">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(profile.linkedin_url || profile.twitter_url || profile.website_url) && (
            <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3">
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                </a>
              )}
              {profile.twitter_url && (
                <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                </a>
              )}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Globe className="h-4 w-4" />
                    Website
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}