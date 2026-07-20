import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, Facebook, Twitter, Instagram, Linkedin, Youtube, Github, ShieldCheck, BadgeCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type AppRole = "admin" | "moderator" | "editor" | "user";

const ProfileEdit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole>>({});
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    website: "",
    location: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    youtube_url: "",
    tiktok_url: "",
    github_url: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            display_name: data.display_name || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
            website: data.website || "",
            location: data.location || "",
            facebook_url: data.facebook_url || "",
            twitter_url: data.twitter_url || "",
            instagram_url: data.instagram_url || "",
            linkedin_url: data.linkedin_url || "",
            youtube_url: data.youtube_url || "",
            tiktok_url: data.tiktok_url || "",
            github_url: data.github_url || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const fetchAccess = async () => {
    if (!user) return;
    const { data: myRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin" as any).maybeSingle();
    const admin = !!myRole;
    setIsAdmin(admin);
    if (!admin) return;

    const [{ data: allProfiles }, { data: allRoles }] = await Promise.all([
      supabase.from("profiles").select("id,user_id,display_name,avatar_url,website,is_verified,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    setProfiles((allProfiles as any[]) || []);
    const nextRoles: Record<string, AppRole> = {};
    ((allRoles as any[]) || []).forEach((r) => { nextRoles[r.user_id] = r.role as AppRole; });
    setRoles(nextRoles);
  };

  useEffect(() => { fetchAccess(); }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      setProfile((p) => ({ ...p, avatar_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল", description: "প্রোফাইল আপডেট হয়েছে" });
    }
    setSaving(false);
  };

  const updateRole = async (targetUserId: string, role: AppRole) => {
    if (targetUserId === user?.id) {
      toast({ title: "নিজের রোল এখান থেকে বদলানো যাবে না", variant: "destructive" });
      return;
    }
    const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", targetUserId);
    if (delError) { toast({ title: "ত্রুটি", description: delError.message, variant: "destructive" }); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: targetUserId, role } as any);
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    setRoles((prev) => ({ ...prev, [targetUserId]: role }));
    toast({ title: "অ্যাকসেস আপডেট হয়েছে" });
  };

  const updateVerified = async (targetUserId: string, verified: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_verified: verified } as any).eq("user_id", targetUserId);
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    setProfiles((prev) => prev.map((p) => p.user_id === targetUserId ? { ...p, is_verified: verified } : p));
    toast({ title: verified ? "ভেরিফাইড করা হয়েছে" : "ভেরিফাইড সরানো হয়েছে" });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const socialFields = [
    { key: "facebook_url", icon: Facebook, label: "Facebook", placeholder: "https://facebook.com/..." },
    { key: "twitter_url", icon: Twitter, label: "Twitter/X", placeholder: "https://x.com/..." },
    { key: "instagram_url", icon: Instagram, label: "Instagram", placeholder: "https://instagram.com/..." },
    { key: "youtube_url", icon: Youtube, label: "YouTube", placeholder: "https://youtube.com/@..." },
    { key: "linkedin_url", icon: Linkedin, label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
    { key: "github_url", icon: Github, label: "GitHub", placeholder: "https://github.com/..." },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">প্রোফাইল সম্পাদনা</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">মূল তথ্য</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {profile.display_name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span><Upload className="h-3.5 w-3.5 mr-1.5" />{uploading ? "আপলোড হচ্ছে..." : "ছবি পরিবর্তন"}</span>
                </Button>
              </Label>
              <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
          </div>
          <div>
            <Label>নাম</Label>
            <Input value={profile.display_name} onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))} />
          </div>
          <div>
            <Label>বায়ো</Label>
            <Textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>লোকেশন</Label>
              <Input value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div>
              <Label>ওয়েবসাইট</Label>
              <Input value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">সোশ্যাল মিডিয়া</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {socialFields.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <f.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder={f.placeholder}
                value={(profile as any)[f.key]}
                onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> অ্যাকসেস ও ভেরিফাইড</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profiles.map((p) => (
              <div key={p.user_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.avatar_url || ""} />
                  <AvatarFallback>{p.display_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate flex items-center gap-1">
                    {p.display_name || "নাম নেই"}
                    {p.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{p.website || p.user_id}</p>
                </div>
                <Select value={roles[p.user_id] || "user"} onValueChange={(value) => updateRole(p.user_id, value as AppRole)} disabled={p.user_id === user?.id}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">ভেরিফাইড</span>
                  <Switch checked={!!p.is_verified} onCheckedChange={(v) => updateVerified(p.user_id, !!v)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        সেভ করুন
      </Button>
    </div>
  );
};

export default ProfileEdit;
