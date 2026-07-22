import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUp, ArrowDown, Plus, Trash2, GripVertical, Settings2, Megaphone, Layout, PanelLeft, PanelRight, RefreshCw,
} from "lucide-react";

interface SiteSection {
  id: string;
  section_key: string;
  label: string;
  icon: string | null;
  is_visible: boolean;
  sort_order: number;
  config: Record<string, any>;
  zone: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

const ZONE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  main: { label: "মেইন কনটেন্ট", icon: <Layout className="h-4 w-4" /> },
  left_sidebar: { label: "বাম সাইডবার", icon: <PanelLeft className="h-4 w-4" /> },
  right_sidebar: { label: "ডান সাইডবার", icon: <PanelRight className="h-4 w-4" /> },
};

const SiteCustomizer = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState("main");
  const [newSection, setNewSection] = useState({ label: "", icon: "", section_key: "", type: "content" });
  const [branding, setBranding] = useState<{ logo_url: string; header_bg: string; footer_bg: string; footer_text: string }>({ logo_url: "", header_bg: "", footer_bg: "", footer_text: "© AHAiWEB" });
  const [savingBranding, setSavingBranding] = useState(false);

  const fetchData = async () => {
    const [sectionsRes, catsRes, brandRes] = await Promise.all([
      supabase.from("site_sections").select("*").order("sort_order"),
      supabase.from("categories").select("id, name, slug, icon, color").order("sort_order"),
      supabase.from("site_settings").select("value").eq("key", "branding").maybeSingle(),
    ]);
    setSections((sectionsRes.data as any as SiteSection[]) || []);
    setCategories(catsRes.data || []);
    if (brandRes.data?.value) setBranding({ logo_url: "", header_bg: "", footer_bg: "", footer_text: "© AHAiWEB", ...(brandRes.data.value as any) });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveBranding = async () => {
    setSavingBranding(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "branding", value: branding as any } as any, { onConflict: "key" });
    setSavingBranding(false);
    if (error) toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    else toast({ title: "ব্র্যান্ডিং সেভ হয়েছে" });
  };

  const zoneSections = sections.filter((s) => (s.zone || "main") === activeZone);

  const updateSection = async (id: string, updates: Partial<SiteSection>) => {
    const { error } = await supabase.from("site_sections").update(updates as any).eq("id", id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      fetchData();
    }
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= zoneSections.length) return;
    const a = zoneSections[index];
    const b = zoneSections[target];
    await Promise.all([
      supabase.from("site_sections").update({ sort_order: b.sort_order } as any).eq("id", a.id),
      supabase.from("site_sections").update({ sort_order: a.sort_order } as any).eq("id", b.id),
    ]);
    fetchData();
  };

  const addSection = async () => {
    if (!newSection.label.trim()) return;
    const key = newSection.section_key || newSection.label.toLowerCase().replace(/\s+/g, "-");
    const maxOrder = Math.max(0, ...zoneSections.map((s) => s.sort_order));
    const isAd = newSection.type === "ad";

    const { error } = await supabase.from("site_sections").insert({
      section_key: key,
      label: newSection.label,
      icon: newSection.icon || (isAd ? "📢" : "📄"),
      sort_order: maxOrder + 1,
      is_visible: !isAd,
      zone: activeZone,
      config: isAd ? { type: "ad", ad_code: "" } : {},
    } as any);

    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      setNewSection({ label: "", icon: "", section_key: "", type: "content" });
      fetchData();
      toast({ title: "সেকশন যোগ হয়েছে" });
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm("এই সেকশন মুছে ফেলতে চান?")) return;
    await supabase.from("site_sections").delete().eq("id", id);
    fetchData();
    toast({ title: "মুছে ফেলা হয়েছে" });
  };

  const updateAdCode = async (id: string, adCode: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    await updateSection(id, { config: { ...section.config, ad_code: adCode } } as any);
  };

  const updateLabel = async (id: string, label: string) => {
    await updateSection(id, { label });
    setEditingId(null);
  };

  // Sync categories as main zone sections
  const syncCategories = async () => {
    const existingKeys = sections.filter(s => s.section_key.startsWith("cat-")).map(s => s.section_key);
    const maxOrder = Math.max(0, ...sections.filter(s => (s.zone || "main") === "main").map(s => s.sort_order));
    
    const toAdd = categories.filter(cat => !existingKeys.includes(`cat-${cat.slug}`));
    if (toAdd.length === 0) {
      toast({ title: "সব ক্যাটেগরি ইতিমধ্যে যোগ করা আছে" });
      return;
    }

    const inserts = toAdd.map((cat, i) => ({
      section_key: `cat-${cat.slug}`,
      label: cat.name,
      icon: cat.icon || "📂",
      sort_order: maxOrder + i + 1,
      is_visible: true,
      zone: "main",
      config: { type: "category", category_id: cat.id, category_slug: cat.slug },
    }));

    const { error } = await supabase.from("site_sections").insert(inserts as any);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      fetchData();
      toast({ title: `${toAdd.length}টি ক্যাটেগরি সেকশন যোগ হয়েছে` });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground">লোড হচ্ছে...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="h-6 w-6" /> সাইট কাস্টমাইজার
        </h2>
        <Badge variant="outline" className="text-xs">
          {sections.filter((s) => s.is_visible).length}/{sections.length} সক্রিয়
        </Badge>
      </div>

      {/* Zone Tabs */}
      <Tabs value={activeZone} onValueChange={setActiveZone}>
        <TabsList className="w-full grid grid-cols-3">
          {Object.entries(ZONE_LABELS).map(([key, { label, icon }]) => (
            <TabsTrigger key={key} value={key} className="gap-1.5 text-xs sm:text-sm">
              {icon} {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(ZONE_LABELS).map((zone) => (
          <TabsContent key={zone} value={zone} className="space-y-4 mt-4">

            {/* Category Sync - only for main zone */}
            {zone === "main" && (
              <Card className="border-dashed border-primary/30">
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">📂 ক্যাটেগরি সিঙ্ক</p>
                    <p className="text-xs text-muted-foreground">ক্যাটেগরি ম্যানেজারের সব ক্যাটেগরি এখানে সেকশন হিসেবে আনুন</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={syncCategories} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> সিঙ্ক
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Add new section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" /> নতুন {zone === "main" ? "সেকশন" : "উইজেট"} যোগ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <select
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                    value={newSection.type}
                    onChange={(e) => setNewSection((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="content">কনটেন্ট</option>
                    <option value="ad">বিজ্ঞাপন স্লট</option>
                  </select>
                  <Input placeholder="লেবেল" value={newSection.label}
                    onChange={(e) => setNewSection((p) => ({ ...p, label: e.target.value }))} className="w-40" />
                  <Input placeholder="আইকন (emoji)" value={newSection.icon}
                    onChange={(e) => setNewSection((p) => ({ ...p, icon: e.target.value }))} className="w-24" />
                  <Input placeholder="কী (ইংরেজি)" value={newSection.section_key}
                    onChange={(e) => setNewSection((p) => ({ ...p, section_key: e.target.value }))} className="w-32" />
                  <Button onClick={addSection} disabled={!newSection.label.trim()} size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1" /> যোগ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sections list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {ZONE_LABELS[zone]?.label} — {zone === "main" ? "সেকশন" : "উইজেট"} সমূহ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {zoneSections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">কোনো আইটেম নেই</p>
                ) : zoneSections.map((section, idx) => {
                  const isAd = section.config?.type === "ad";
                  const isCat = section.config?.type === "category";
                  return (
                    <div key={section.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        section.is_visible ? "border-border bg-card" : "border-dashed border-muted-foreground/30 bg-muted/30 opacity-60"
                      }`}>
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg">{section.icon}</span>
                          {editingId === section.id ? (
                            <Input defaultValue={section.label} className="h-7 text-sm w-48" autoFocus
                              onBlur={(e) => updateLabel(section.id, e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") updateLabel(section.id, e.currentTarget.value); }} />
                          ) : (
                            <span className="text-sm font-medium cursor-pointer hover:text-primary"
                              onClick={() => setEditingId(section.id)}>{section.label}</span>
                          )}
                          {isAd && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Megaphone className="h-3 w-3" /> বিজ্ঞাপন
                            </Badge>
                          )}
                          {isCat && (
                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                              📂 ক্যাটেগরি
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">{section.section_key}</Badge>
                        </div>

                        {isAd && section.is_visible && (
                          <Textarea placeholder="বিজ্ঞাপন কোড (HTML/JS)..." className="text-xs h-16 mt-1"
                            defaultValue={section.config?.ad_code || ""}
                            onBlur={(e) => updateAdCode(section.id, e.target.value)} />
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Switch checked={section.is_visible}
                          onCheckedChange={(v) => updateSection(section.id, { is_visible: v })} />
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => moveSection(idx, "up")} disabled={idx === 0}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => moveSection(idx, "down")} disabled={idx === zoneSections.length - 1}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => deleteSection(section.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-dashed">
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          💡 তিনটি জোনে (মেইন, বাম ও ডান সাইডবার) সেকশন/উইজেট সাজান, হাইড/শো করুন। ক্যাটেগরি সিঙ্ক করে সরাসরি মেইন সেকশনে আনুন।
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteCustomizer;
