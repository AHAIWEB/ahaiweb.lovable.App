import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Save, X, Settings2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
  show_in_nav: boolean;
  parent_id: string | null;
  external_url: string | null;
}

const CategoryManager = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", color: "#e11d48", sort_order: 0, parent_id: "", external_url: "" });

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    setCategories((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^\u0980-\u09FFa-z0-9-]/g, "");

  const resetForm = () => {
    setForm({ name: "", slug: "", icon: "", color: "#e11d48", sort_order: 0, parent_id: "", external_url: "" });
    setEditingId(null);
  };

  const parentCategories = categories.filter((c) => !c.parent_id);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const slug = form.slug || generateSlug(form.name);
    const payload = {
      name: form.name,
      slug,
      icon: form.icon || null,
      color: form.color || null,
      sort_order: form.sort_order,
      parent_id: form.parent_id || null,
      external_url: form.external_url || null,
    };

    if (editingId) {
      const { error } = await supabase.from("categories").update(payload as any).eq("id", editingId);
      if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
      toast({ title: "আপডেট হয়েছে" });
    } else {
      const { error } = await supabase.from("categories").insert(payload as any);
      if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
      toast({ title: "ক্যাটেগরি তৈরি হয়েছে" });
    }
    resetForm();
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "",
      color: cat.color || "#e11d48",
      sort_order: cat.sort_order || 0,
      parent_id: cat.parent_id || "",
      external_url: cat.external_url || "",
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    toast({ title: "মুছে ফেলা হয়েছে" });
    fetchCategories();
  };

  const toggleNav = async (id: string, current: boolean) => {
    const { error } = await supabase.from("categories").update({ show_in_nav: !current } as any).eq("id", id);
    if (error) { toast({ title: "ত্রুটি", description: error.message, variant: "destructive" }); return; }
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, show_in_nav: !current } : c));
  };

  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">ক্যাটেগরি ম্যানেজমেন্ট</h2>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
          <Link to="/admin/site-customizer"><Settings2 className="h-3.5 w-3.5" /> সাইট কাস্টমাইজ</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? "সম্পাদনা" : "নতুন ক্যাটেগরি"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="নাম" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} />
            <Input placeholder="স্লাগ" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="আইকন (emoji)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="h-10 w-10 rounded cursor-pointer border-0" />
              <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="flex-1" />
            </div>
            <Input type="number" placeholder="ক্রম" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.parent_id} onValueChange={(v) => setForm((f) => ({ ...f, parent_id: v === "none" ? "" : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="প্যারেন্ট ক্যাটেগরি (ঐচ্ছিক)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— কোনো প্যারেন্ট নেই —</SelectItem>
                {parentCategories
                  .filter((c) => c.id !== editingId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input placeholder="ওয়েব লিংক (ঐচ্ছিক)" value={form.external_url} onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-1.5">
              {editingId ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editingId ? "আপডেট" : "যোগ করুন"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}><X className="h-3.5 w-3.5 mr-1" /> বাতিল</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">সকল ক্যাটেগরি ({categories.length})</CardTitle></CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">কোনো ক্যাটেগরি নেই</p>
          ) : (
            <div className="space-y-2">
              {parentCategories.map((cat) => {
                const children = getChildren(cat.id);
                return (
                  <div key={cat.id}>
                    <CategoryRow cat={cat} onEdit={handleEdit} onDelete={handleDelete} onToggleNav={toggleNav} hasChildren={children.length > 0} />
                    {children.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1 border-l-2 border-border pl-3">
                        {children.map((child) => (
                          <CategoryRow key={child.id} cat={child} onEdit={handleEdit} onDelete={handleDelete} onToggleNav={toggleNav} isChild />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Orphan categories (parent_id set but parent doesn't exist, or standalone) */}
              {categories
                .filter((c) => c.parent_id && !categories.find((p) => p.id === c.parent_id))
                .map((cat) => (
                  <CategoryRow key={cat.id} cat={cat} onEdit={handleEdit} onDelete={handleDelete} onToggleNav={toggleNav} />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface CategoryRowProps {
  cat: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  onToggleNav: (id: string, current: boolean) => void;
  hasChildren?: boolean;
  isChild?: boolean;
}

const CategoryRow = ({ cat, onEdit, onDelete, onToggleNav, hasChildren, isChild }: CategoryRowProps) => (
  <div className={`flex items-center justify-between p-3 rounded-lg border border-border ${isChild ? "bg-muted/30" : ""}`}>
    <div className="flex items-center gap-3">
      {isChild && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
      <span className="text-lg">{cat.icon || "📁"}</span>
      <div>
        <p className="text-sm font-medium">{cat.name}</p>
        <p className="text-xs text-muted-foreground">/{cat.slug}</p>
        {cat.external_url && <p className="text-xs text-muted-foreground truncate max-w-[220px]">↗ {cat.external_url}</p>}
      </div>
      {cat.color && (
        <Badge variant="outline" className="text-xs" style={{ borderColor: cat.color, color: cat.color }}>
          {cat.color}
        </Badge>
      )}
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5" title="মেনুতে দেখান">
        <span className="text-[10px] text-muted-foreground">মেনু</span>
        <Switch checked={cat.show_in_nav} onCheckedChange={() => onToggleNav(cat.id, cat.show_in_nav)} />
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cat)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(cat.id)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
);

export default CategoryManager;
