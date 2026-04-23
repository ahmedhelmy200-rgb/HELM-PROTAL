import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import FounderCard from "../components/shared/FounderCard";
import EmptyState from "../components/shared/EmptyState";
import { industryLabels } from "../components/shared/IndustryBadge";
import { stageLabels } from "../components/shared/FundingStageBadge";

export default function Discover() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);

    const [allProfiles, allConnections] = await Promise.all([
      base44.entities.FounderProfile.list("-created_date"),
      base44.entities.ConnectionRequest.filter({ from_email: u.email }),
    ]);

    const mine = allProfiles.find((p) => p.user_email === u.email);
    setMyProfile(mine);
    setProfiles(allProfiles.filter((p) => p.user_email !== u.email));
    setConnections(allConnections);
    setLoading(false);
  };

  const handleConnect = async (profile) => {
    await base44.entities.ConnectionRequest.create({
      from_email: user.email,
      from_name: myProfile?.full_name || user.full_name,
      to_email: profile.user_email,
      to_name: profile.full_name,
      status: "pending",
    });
    setConnections([...connections, { from_email: user.email, to_email: profile.user_email, status: "pending" }]);
  };

  const getConnectionStatus = (profile) => {
    const conn = connections.find((c) => c.to_email === profile.user_email);
    return conn?.status || null;
  };

  const filtered = profiles.filter((p) => {
    const matchSearch =
      !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.startup_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.one_liner?.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === "all" || p.industry === industryFilter;
    const matchStage = stageFilter === "all" || p.funding_stage === stageFilter;
    const matchLocation =
      !locationFilter ||
      p.location?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchIndustry && matchStage && matchLocation;
  });

  const hasActiveFilters = industryFilter !== "all" || stageFilter !== "all" || locationFilter;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Discover Founders
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Connect with first-time founders building the future
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, startup, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="h-11 gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {(industryFilter !== "all" ? 1 : 0) + (stageFilter !== "all" ? 1 : 0) + (locationFilter ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-card rounded-xl border border-border">
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {Object.entries(industryLabels).filter(([k]) => k !== "general").map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {Object.entries(stageLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-48"
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIndustryFilter("all"); setStageFilter("all"); setLocationFilter(""); }}
              className="text-muted-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mt-4" />
              <Skeleton className="h-3 w-3/4 mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((profile) => {
            const status = getConnectionStatus(profile);
            return (
              <FounderCard
                key={profile.id}
                profile={profile}
                showConnect={!!myProfile}
                onConnect={handleConnect}
                isConnected={status === "accepted"}
                isPending={status === "pending"}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No founders found"
          description="Try adjusting your search or filters to find more founders"
        />
      )}
    </div>
  );
}