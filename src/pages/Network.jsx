import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users, UserPlus, Clock, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import FounderCard from "../components/shared/FounderCard";
import EmptyState from "../components/shared/EmptyState";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Network() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);

    const [allProfiles, sentRequests, receivedRequests] = await Promise.all([
      base44.entities.FounderProfile.list(),
      base44.entities.ConnectionRequest.filter({ from_email: u.email }),
      base44.entities.ConnectionRequest.filter({ to_email: u.email }),
    ]);

    setProfiles(allProfiles);

    const accepted = [
      ...sentRequests.filter((r) => r.status === "accepted"),
      ...receivedRequests.filter((r) => r.status === "accepted"),
    ];
    const connectedEmails = accepted.map((c) =>
      c.from_email === u.email ? c.to_email : c.from_email
    );
    setConnections(allProfiles.filter((p) => connectedEmails.includes(p.user_email)));
    setPendingReceived(receivedRequests.filter((r) => r.status === "pending"));
    setPendingSent(sentRequests.filter((r) => r.status === "pending"));
    setLoading(false);
  };

  const handleAccept = async (request) => {
    await base44.entities.ConnectionRequest.update(request.id, { status: "accepted" });
    loadData();
  };

  const handleDecline = async (request) => {
    await base44.entities.ConnectionRequest.update(request.id, { status: "declined" });
    loadData();
  };

  const getProfile = (email) => profiles.find((p) => p.user_email === email);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6">
              <Skeleton className="h-14 w-14 rounded-2xl mb-3" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">My Network</h1>
      <p className="text-muted-foreground mb-8">Manage your connections and requests</p>

      <Tabs defaultValue="connections">
        <TabsList className="mb-6">
          <TabsTrigger value="connections" className="gap-2">
            <Users className="h-4 w-4" />
            Connections
            <Badge variant="secondary" className="ml-1 text-[10px]">{connections.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Received
            {pendingReceived.length > 0 && (
              <Badge className="ml-1 bg-primary text-primary-foreground text-[10px]">{pendingReceived.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Clock className="h-4 w-4" />
            Sent
            <Badge variant="secondary" className="ml-1 text-[10px]">{pendingSent.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {connections.map((profile) => (
                <FounderCard
                  key={profile.id}
                  profile={profile}
                  showConnect={false}
                  isConnected={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No connections yet"
              description="Start discovering founders and send connection requests"
              action={
                <Link to={createPageUrl("Discover")}>
                  <Button>Discover Founders</Button>
                </Link>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="received">
          {pendingReceived.length > 0 ? (
            <div className="space-y-3">
              {pendingReceived.map((request) => {
                const profile = getProfile(request.from_email);
                return (
                  <Card key={request.id} className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                        {(request.from_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{request.from_name}</h3>
                        {profile && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {profile.startup_name}
                          </div>
                        )}
                        {request.message && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">"{request.message}"</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(request)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecline(request)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={UserPlus}
              title="No pending requests"
              description="You're all caught up! Check back later for new connection requests."
            />
          )}
        </TabsContent>

        <TabsContent value="sent">
          {pendingSent.length > 0 ? (
            <div className="space-y-3">
              {pendingSent.map((request) => (
                <Card key={request.id} className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold">
                      {(request.to_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{request.to_name}</h3>
                      <p className="text-sm text-muted-foreground">Request sent</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No sent requests"
              description="Connection requests you send will appear here"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}