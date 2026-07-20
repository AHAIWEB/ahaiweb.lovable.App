import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, UserCircle2, CalendarRange, Quote, Link2, Download, BookOpen, ImagePlus } from "lucide-react";
import { generateBloggerTheme, generateBloggerAtomExport, downloadFile } from "@/lib/bloggerExport";
import { Link } from "react-router-dom";

const QUOTE_SOURCES = [
  { url: "https://www.bani.com.bd/", name: "bani.com.bd" },
  { url: "https://quotes.gonevis.com/motivational/", name: "gonevis - Motivational" },
  { url: "https://quotes.gonevis.com/", name: "gonevis - Home" },
  { url: "https://www.banglamsg.com/quotes/", name: "banglamsg - Quotes" },
  { url: "https://www.itolbitol.com/category/quote/", name: "itolbitol - Quote" },
  { url: "https://bn.wikiquote.org/wiki/বিশেষ:সাম্প্রতিক_পরিবর্তন", name: "উইকিউক্তি" },
];

export default function ScraperHub() {
  const { user } = useAuth();
  const [personUrls, setPersonUrls] = useState("");
  const [personLoading, setPersonLoading] = useState(false);
  const [personLog, setPersonLog] = useState<any[]>([]);

  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsLog, setEventsLog] = useState<any>(null);

  const [selectedSources, setSelectedSources] = useState<string[]>(QUOTE_SOURCES.map((s) => s.url));
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesLog, setQuotesLog] = useState<any>(null);

  // Smart URL scraper state
  const [smartUrls, setSmartUrls] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartLog, setSmartLog] = useState<any[]>([]);

  // Blogger export state
  const [bloggerTitle, setBloggerTitle] = useState("AHAiWEB");
  const [bloggerDesc, setBloggerDesc] = useState("Personal Blog · News portal + Creative");
  const [bloggerPrimary, setBloggerPrimary] = useState("#dc2626");
  const [exportingPosts, setExportingPosts] = useState(false);

  // Dictionary scraper state
  const [dictUrls, setDictUrls] = useState("https://www.bangladict.net/");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictLog, setDictLog] = useState<any>(null);

  const runDict = async () => {
    const urls = dictUrls.split(/[👉\n,]+/).map((s) => s.trim()).filter((s) => s.startsWith("http"));
    if (!urls.length) { toast({ title: "URL দিন", variant: "destructive" }); return; }
    setDictLoading(true);
    setDictLog(null);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-dictionary", { body: { urls } });
      if (error) throw error;
      setDictLog(data);
      toast({ title: `+${data.total_saved} শব্দ যুক্ত` });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally {
      setDictLoading(false);
    }
  };

  const runSmart = async () => {
    const urls = smartUrls.split(/[👉\n,]+/).map((s) => s.trim()).filter((s) => s.startsWith("http"));
    if (!urls.length) { toast({ title: "URL দিন", variant: "destructive" }); return; }
    setSmartLoading(true);
    setSmartLog([]);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-url", {
        body: { urls },
      });
      if (error) throw error;
      setSmartLog(data.results || []);
      toast({ title: `সম্পন্ন: ${data.ok}/${data.total}` });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally {
      setSmartLoading(false);
    }
  };

  const downloadTheme = () => {
    const xml = generateBloggerTheme({
      title: bloggerTitle, description: bloggerDesc, primaryColor: bloggerPrimary,
    });
    downloadFile(`${bloggerTitle.toLowerCase().replace(/\s+/g, "-")}-blogger-theme.xml`, xml);
    toast({ title: "Blogger theme ডাউনলোড শুরু" });
  };

  const exportPosts = async () => {
    setExportingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,content,excerpt,published_at,created_at,slug,featured_image")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      const xml = generateBloggerAtomExport(data || [], bloggerTitle);
      downloadFile(`${bloggerTitle.toLowerCase().replace(/\s+/g, "-")}-posts-export.xml`, xml);
      toast({ title: `${data?.length || 0} পোস্ট এক্সপোর্ট হয়েছে` });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally {
      setExportingPosts(false);
    }
  };

  const runPersons = async () => {
    const urls = personUrls.split(/[👉\n,]+/).map((s) => s.trim()).filter((s) => s.startsWith("http"));
    if (!urls.length) { toast({ title: "URL দিন", variant: "destructive" }); return; }
    setPersonLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-wiki-person", { body: { urls } });
      if (error) throw error;
      setPersonLog(data.results || []);
      const ok = data.results?.filter((r: any) => r.ok).length || 0;
      toast({ title: `সম্পন্ন: ${ok}/${urls.length}` });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally {
      setPersonLoading(false);
    }
  };

  const runEvents = async (onlyToday = false) => {
    setEventsLoading(true);
    setEventsLog(null);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-wiki-on-this-day", { body: { onlyToday } });
      if (error) throw error;
      setEventsLog(data);
      toast({ title: `+${data.inserted} ঘটনা যুক্ত হয়েছে`, description: `স্কিপ: ${data.skipped}` });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally {
      setEventsLoading(false);
    }
  };

  const runQuotes = async () => {
    const sources = QUOTE_SOURCES.filter((s) => selectedSources.includes(s.url));
    if (!sources.length) { toast({ title: "সোর্স নির্বাচন করুন", variant: "destructive" }); return; }
    setQuotesLoading(true);
    setQuotesLog(null);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-quotes", { body: { sources } });
      if (error) throw error;
      setQuotesLog(data);
      toast({ title: `+${data.inserted} উক্তি যুক্ত হয়েছে` });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally {
      setQuotesLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">🕷️ স্ক্র্যাপার হাব</h1>
        <p className="text-sm text-muted-foreground">বাল্ক কন্টেন্ট ফেচ — উইকিপিডিয়া পিপল, ইতিহাসে আজ, উক্তি</p>
      </div>

      <Tabs defaultValue="smart" className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="smart"><Link2 className="h-4 w-4 mr-1" /> URL</TabsTrigger>
          <TabsTrigger value="people"><UserCircle2 className="h-4 w-4 mr-1" /> পিপল</TabsTrigger>
          <TabsTrigger value="events"><CalendarRange className="h-4 w-4 mr-1" /> এই দিনে</TabsTrigger>
          <TabsTrigger value="quotes"><Quote className="h-4 w-4 mr-1" /> উক্তি</TabsTrigger>
          <TabsTrigger value="dict"><BookOpen className="h-4 w-4 mr-1" /> অভিধান</TabsTrigger>
          <TabsTrigger value="photo"><ImagePlus className="h-4 w-4 mr-1" /> ফটোকার্ড</TabsTrigger>
          <TabsTrigger value="blogger"><Download className="h-4 w-4 mr-1" /> Blogger</TabsTrigger>
        </TabsList>

        <TabsContent value="smart">
          <Card>
            <CardHeader>
              <CardTitle>স্মার্ট URL স্ক্র্যাপার</CardTitle>
              <p className="text-xs text-muted-foreground">
                যেকোনো URL — অটো-রাউটিং: <code>bani.com.bd/author/*</code> → quotes_pool · <code>wikipedia.org</code> + অন্যান্য → posts
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={8}
                value={smartUrls}
                onChange={(e) => setSmartUrls(e.target.value)}
                placeholder="http://bani.com.bd/author/184&#10;http://bani.com.bd/author/68&#10;https://example.com/article"
                className="font-mono text-xs"
              />
              <Button onClick={runSmart} disabled={smartLoading}>
                {smartLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                ফেচ ও সেভ
              </Button>
              {smartLog.length > 0 && (
                <div className="border rounded-md p-3 max-h-80 overflow-auto text-xs space-y-1">
                  {smartLog.map((r, i) => (
                    <div key={i} className={r.ok ? "text-green-600" : "text-destructive"}>
                      {r.ok ? "✓" : "✗"} <span className="font-mono">[{r.type}]</span>{" "}
                      {r.author ? `${r.author} — ${r.inserted}/${r.found} quotes` : (r.title || r.url)}
                      {r.updated && " (আপডেট)"}
                      {r.error && ` — ${r.error}`}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="people">
          <Card>
            <CardHeader>
              <CardTitle>উইকিপিডিয়া পিপল স্ক্র্যাপার</CardTitle>
              <p className="text-xs text-muted-foreground">
                Multi-URL — 👉 অথবা newline দিয়ে আলাদা করুন। ডুপ্লিকেট অটো-আপডেট হবে।
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={8}
                value={personUrls}
                onChange={(e) => setPersonUrls(e.target.value)}
                placeholder="https://bn.wikipedia.org/wiki/আব্রাহাম_লিংকন 👉 https://bn.wikipedia.org/wiki/যোসেফ_স্ট্যালিন"
                className="font-mono text-xs"
              />
              <Button onClick={runPersons} disabled={personLoading}>
                {personLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                ফেচ ও সেভ
              </Button>
              {personLog.length > 0 && (
                <div className="border rounded-md p-3 max-h-72 overflow-auto text-xs space-y-1">
                  {personLog.map((r, i) => (
                    <div key={i} className={r.ok ? "text-green-600" : "text-destructive"}>
                      {r.ok ? "✓" : "✗"} {r.title || r.url} {r.updated ? "(আপডেট)" : r.ok ? "(নতুন)" : `— ${r.error}`}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>ইতিহাসে আজ ইম্পোর্ট</CardTitle>
              <p className="text-xs text-muted-foreground">
                বাংলা উইকিপিডিয়ার "X মাসের Y" পেজ থেকে ঘটনা/জন্ম/মৃত্যু স্ক্র্যাপ। ডুপ্লিকেট DB-লেভেলে স্কিপ।
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => runEvents(true)} disabled={eventsLoading} variant="outline">
                  {eventsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  শুধু আজকের দিন
                </Button>
                <Button onClick={() => runEvents(false)} disabled={eventsLoading}>
                  {eventsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  ১২ মাসের সব ঘটনা ইম্পোর্ট
                </Button>
              </div>
              {eventsLog && (
                <div className="border rounded-md p-3 text-xs space-y-1 max-h-72 overflow-auto">
                  <div className="font-semibold">+{eventsLog.inserted} নতুন · {eventsLog.skipped} ডুপ্লিকেট</div>
                  {eventsLog.log?.slice(0, 50).map((l: string, i: number) => <div key={i}>{l}</div>)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardHeader>
              <CardTitle>উক্তি স্ক্র্যাপার</CardTitle>
              <p className="text-xs text-muted-foreground">সোর্স নির্বাচন করে ফেচ করুন। `quotes_pool` এ সেভ হবে।</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {QUOTE_SOURCES.map((s) => (
                  <label key={s.url} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedSources.includes(s.url)}
                      onCheckedChange={(v) =>
                        setSelectedSources((prev) => v ? [...prev, s.url] : prev.filter((u) => u !== s.url))
                      }
                    />
                    <span>{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto truncate max-w-xs">{s.url}</span>
                  </label>
                ))}
              </div>
              <Button onClick={runQuotes} disabled={quotesLoading}>
                {quotesLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                সব ফেচ
              </Button>
              {quotesLog && (
                <div className="border rounded-md p-3 text-xs space-y-1 max-h-72 overflow-auto">
                  <div className="font-semibold">+{quotesLog.inserted} নতুন উক্তি</div>
                  {quotesLog.log?.map((l: any, i: number) => (
                    <div key={i}>{l.url} — {l.error ? `ERR ${l.error}` : `${l.inserted}/${l.found}`}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dict">
          <Card>
            <CardHeader>
              <CardTitle>অভিধান স্ক্র্যাপার</CardTitle>
              <p className="text-xs text-muted-foreground">
                bangladict.net বা যেকোনো শব্দার্থ পেজের URL — অটো-পার্সিং (h2 + অর্থ, dl/dt/dd, table)। ডুপ্লিকেট স্কিপ।
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={6}
                value={dictUrls}
                onChange={(e) => setDictUrls(e.target.value)}
                placeholder="https://www.bangladict.net/&#10;https://www.bangladict.net/dictionary/a"
                className="font-mono text-xs"
              />
              <Button onClick={runDict} disabled={dictLoading}>
                {dictLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                ফেচ ও সেভ
              </Button>
              {dictLog && (
                <div className="border rounded-md p-3 text-xs space-y-1 max-h-72 overflow-auto">
                  <div className="font-semibold">+{dictLog.total_saved} শব্দ সেভ হয়েছে</div>
                  {Object.entries(dictLog.per_url || {}).map(([u, n]: any) => (
                    <div key={u}>{u} — {n} শব্দ</div>
                  ))}
                  {dictLog.errors?.map((e: string, i: number) => (
                    <div key={i} className="text-destructive">{e}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photo">
          <Card>
            <CardHeader>
              <CardTitle>শুভ সকাল ফটোকার্ড মেকার</CardTitle>
              <p className="text-xs text-muted-foreground">
                ১:১ ও ৪:৫ কার্ড, কাস্টম লোগো, হেডার, ফুটার, ব্যাকগ্রাউন্ড এবং দিনপঞ্জি অটো-ফেচ।
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/photo-card-maker"><ImagePlus className="h-4 w-4 mr-1" /> ফটোকার্ড মেকার খুলুন</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blogger">
          <Card>
            <CardHeader>
              <CardTitle>Blogger Theme XML এক্সপোর্ট</CardTitle>
              <p className="text-xs text-muted-foreground">
                সাইটের লেআউট/স্টাইল অনুযায়ী Blogger XML থিম জেনারেট করো। আলাদা বাটনে পোস্টগুলোও Blogger Atom XML হিসেবে ডাউনলোড।
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium">Blog Title</label>
                  <Input value={bloggerTitle} onChange={(e) => setBloggerTitle(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium">Description</label>
                  <Input value={bloggerDesc} onChange={(e) => setBloggerDesc(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium">Primary Color</label>
                  <Input type="color" value={bloggerPrimary} onChange={(e) => setBloggerPrimary(e.target.value)} className="h-10 p-1" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={downloadTheme}>
                  <Download className="h-4 w-4 mr-1" /> Theme XML ডাউনলোড
                </Button>
                <Button onClick={exportPosts} disabled={exportingPosts} variant="outline">
                  {exportingPosts && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  পোস্ট Atom XML এক্সপোর্ট
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p className="font-semibold">কীভাবে ব্যবহার করবেন:</p>
                <p>১. Blogger Dashboard → Theme → Backup/Restore → "Restore" → theme XML ফাইল আপলোড।</p>
                <p>২. পোস্ট Import: Blogger → Settings → Import &amp; back up → Import content → Atom XML ফাইল আপলোড।</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
