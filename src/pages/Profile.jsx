import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, X, Plus } from "lucide-react";
import { industryLabels } from "../components/shared/IndustryBadge";
import { stageLabels } from "../components/shared/FundingStageBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const LOOKING_FOR_OPTIONS = ["Co-founder", "Mentor", "Investor", "Advisor", "Developer", "Designer", "Marketing help", "Sales partner", "Networking"];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    startup_name: "",
    one_liner: "",
    bio: "",
    industry: "saas",
    funding_stage: "idea",
    location: "",
    linkedin_url: "",
    twitter_url: "",
    website_url: "",
    looking_for: [],
    photo_url: "",
    photo_url_ref: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);
    const profiles = await base44.entities.FounderProfile.filter({ user_email: u.email });
    if (profiles.length > 0) {
      const p = profiles[0];
      setProfile(p);
      setForm({
        full_name: p.full_name || u.full_name || "",
        startup_name: p.startup_name || "",
        one_liner: p.one_liner || "",
        bio: p.bio || "",
        industry: p.industry || "saas",
        funding_stage: p.funding_stage || "idea",
        location: p.location || "",
        linkedin_url: p.linkedin_url || "",
        twitter_url: p.twitter_url || "",
        website_url: p.website_url || "",
        looking_for: p.looking_for || [],
        photo_url: p.photo_url || "",
        photo_url_ref: p.photo_url_ref || p.photo_url || "",
      });
    } else {
      setForm((f) => ({ ...f, full_name: u.full_name || "" }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, photo_url: form.photo_url_ref || form.photo_url, user_email: user.email };
    if (profile) {
      await base44.entities.FounderProfile.update(profile.id, data);
    } else {
      const created = await base44.entities.FounderProfile.create(data);
      setProfile(created);
    }
    toast.success("Profile saved!");
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { preview_url, file_url, storage_ref } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, photo_url: preview_url || file_url, photo_url_ref: storage_ref || file_url });
  };

  const toggleLookingFor = (item) => {
    const list = form.looking_for || [];
    if (list.includes(item)) {
      setForm({ ...form, looking_for: list.filter((i) => i !== item) });
    } else {
      setForm({ ...form, looking_for: [...list, item] });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {profile ? "Edit Profile" : "Create Your Profile"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {profile ? "Keep your profile up to date" : "Tell the community about yourself and your startup"}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-5">
            {form.photo_url ? (
              <div className="relative">
                <img src={form.photo_url} alt="Profile" className="h-20 w-20 rounded-2xl object-cover shadow-md" />
                <button
                  onClick={() => setForm({ ...form, photo_url: "" })}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="h-20 w-20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
            <div>
              <h3 className="font-medium text-foreground">Profile Photo</h3>
              <p className="text-sm text-muted-foreground">Upload a professional headshot</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Startup Name *</Label>
              <Input value={form.startup_name} onChange={(e) => setForm({ ...form, startup_name: e.target.value })} placeholder="My Startup Inc." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>One-Liner</Label>
            <Input
              value={form.one_liner}
              onChange={(e) => setForm({ ...form, one_liner: e.target.value })}
              placeholder="Building the future of..."
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">{(form.one_liner || "").length}/120</p>
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell the community about yourself and your journey..."
              className="h-28"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Industry *</Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(industryLabels).filter(([k]) => k !== "general").map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Funding Stage *</Label>
              <Select value={form.funding_stage} onValueChange={(v) => setForm({ ...form, funding_stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="San Francisco" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>What are you looking for?</Label>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((item) => {
                const selected = (form.looking_for || []).includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleLookingFor(item)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {selected && "✓ "}{item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-medium text-foreground">Social Links</h3>
            <div className="grid grid-cols-1 gap-3">
              <Input
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
              <Input
                value={form.twitter_url}
                onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
                placeholder="https://twitter.com/..."
              />
              <Input
                value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                placeholder="https://yourstartup.com"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !form.full_name || !form.startup_name || !form.location}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : profile ? "Save Changes" : "Create Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}