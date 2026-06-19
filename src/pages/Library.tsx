import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Upload, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Library = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    category: "",
    is_public: false,
    file: null as File | null,
  });

  const { data: publicBooks = [] } = useQuery({
    queryKey: ["public-ebooks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ebooks")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: myBooks = [] } = useQuery({
    queryKey: ["my-ebooks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("ebooks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleUpload = async () => {
    if (!user) {
      toast.error("লগইন করুন");
      return;
    }
    if (!form.file || !form.title) {
      toast.error("টাইটেল ও ফাইল দিন");
      return;
    }
    const name = form.file.name.toLowerCase();
    const isPdf = form.file.type === "application/pdf" || name.endsWith(".pdf");
    const isEpub = name.endsWith(".epub") || form.file.type === "application/epub+zip";
    if (!isPdf && !isEpub) {
      toast.error("শুধু PDF বা EPUB ফাইল");
      return;
    }
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${form.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("ebooks").upload(path, form.file, {
        contentType: isEpub ? "application/epub+zip" : "application/pdf",
      });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("ebooks").insert({
        user_id: user.id,
        title: form.title,
        author: form.author || null,
        description: form.description || null,
        category: form.category || null,
        is_public: form.is_public,
        pdf_url: path,
        file_path: path,
        file_size: form.file.size,
      } as any);
      if (dbErr) throw dbErr;
      toast.success("আপলোড সফল");
      setOpen(false);
      setForm({ title: "", author: "", description: "", category: "", is_public: false, file: null });
      qc.invalidateQueries({ queryKey: ["public-ebooks"] });
      qc.invalidateQueries({ queryKey: ["my-ebooks"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    await supabase.from("ebooks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-ebooks"] });
    toast.success("ডিলিট হলো");
  };

  const BookGrid = ({ books, mine }: { books: any[]; mine?: boolean }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {books.map((b) => (
        <Card key={b.id} className="overflow-hidden group">
          <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
            {b.cover_url ? (
              <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="h-12 w-12 text-primary/40" />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link to={`/library/${b.id}`}><Eye className="h-4 w-4" /></Link>
              </Button>
              {mine && (
                <Button size="sm" variant="destructive" onClick={() => deleteBook(b.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="p-2">
            <p className="text-sm font-semibold truncate">{b.title}</p>
            {b.author && <p className="text-xs text-muted-foreground truncate">{b.author}</p>}
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-display font-black">লাইব্রেরি</h1>
            <p className="text-sm text-muted-foreground">PDF বই · ই-বুক রিডার</p>
          </div>
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Upload className="h-4 w-4 mr-1" /> আপলোড</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>নতুন বই আপলোড</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>টাইটেল *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>লেখক</Label>
                    <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                  </div>
                  <div>
                    <Label>বর্ণনা</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>ক্যাটাগরি</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div>
                    <Label>PDF বা EPUB ফাইল *</Label>
                    <Input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
                    <Label>পাবলিক করুন (সবাই দেখতে পাবে)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? "আপলোড হচ্ছে..." : "সেভ"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="public">
          <TabsList>
            <TabsTrigger value="public">পাবলিক ({publicBooks.length})</TabsTrigger>
            {user && <TabsTrigger value="mine">আমার শেলফ ({myBooks.length})</TabsTrigger>}
          </TabsList>
          <TabsContent value="public" className="mt-4">
            {publicBooks.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">এখনো কোনো বই নেই</p>
            ) : (
              <BookGrid books={publicBooks} />
            )}
          </TabsContent>
          {user && (
            <TabsContent value="mine" className="mt-4">
              {myBooks.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">শেলফ খালি — আপলোড দিন</p>
              ) : (
                <BookGrid books={myBooks} mine />
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Library;
