import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import { ArrowLeft, CalendarDays, Download, ImagePlus, Loader2, RefreshCw, Square, RectangleVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Ratio = "1:1" | "4:5";
type Template = "sunrise" | "midnight" | "emerald" | "sunset";

const templates: Record<Template, { label: string; bg: string; accent: string }> = {
  sunrise: { label: "সূর্যোদয়", bg: "linear-gradient(160deg,#f97316,#f43f5e 48%,#a21caf)", accent: "#fff7ed" },
  midnight: { label: "মিডনাইট", bg: "linear-gradient(160deg,#0f172a,#1e3a8a 48%,#312e81)", accent: "#c7d2fe" },
  emerald: { label: "প্রকৃতি", bg: "linear-gradient(160deg,#065f46,#059669 48%,#84cc16)", accent: "#ecfccb" },
  sunset: { label: "গোধূলি", bg: "linear-gradient(160deg,#7c2d12,#c2410c 48%,#eab308)", accent: "#fef3c7" },
};

const defaultPrayers = {
  fajr: "—:—",
  dhuhr: "—:—",
  asr: "—:—",
  maghrib: "—:—",
  isha: "—:—",
};

export default function PhotoCardMaker() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState<Ratio>("4:5");
  const [template, setTemplate] = useState<Template>("sunrise");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("শুভ সকাল");
  const [logo, setLogo] = useState("AHAiWEB");
  const [footer, setFooter] = useState("ahaiweb.lovable.app");
  const [background, setBackground] = useState("");
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendar, setCalendar] = useState({
    weekday: "সোমবার",
    gregorian: "২০ জুলাই ২০২৬",
    bangla: "৫ শ্রাবণ ১৪৩৩",
    hijri: "৫ সফর ১৪৪৮",
    season: "বর্ষা",
    tithi: "সপ্তমী (শুক্ল)",
    vikram: "আষাঢ়, ২০৮৩",
    nakshatra: "উত্তরফাল্গুনী",
    shaka: "১৯৪৮",
    sunrise: "—:—",
    sunset: "—:—",
  });
  const [prayers, setPrayers] = useState(defaultPrayers);

  const cardSize = ratio === "1:1" ? "aspect-square max-w-[720px]" : "aspect-[4/5] max-w-[640px]";

  const bgStyle = useMemo(() => ({
    backgroundImage: background
      ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${background})`
      : templates[template].bg,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: templates[template].accent,
  }), [background, template]);

  const fetchCalendar = async () => {
    setLoadingCalendar(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-day-calendar", { body: { date } });
      if (error) throw error;
      if (data?.data) {
        setCalendar((prev) => ({ ...prev, ...data.data }));
        toast({ title: "দিনপঞ্জি আপডেট হয়েছে" });
      }
    } catch (e: any) {
      toast({ title: "দিনপঞ্জি আনা যায়নি", description: e.message, variant: "destructive" });
    } finally {
      setLoadingCalendar(false);
    }
  };

  const download = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `good-morning-card-${ratio.replace(":", "x")}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "ফটোকার্ড ডাউনলোড হয়েছে" });
    } catch (e: any) {
      toast({ title: "ডাউনলোড ব্যর্থ", description: e.message, variant: "destructive" });
    }
  };

  const updatePrayer = (key: keyof typeof prayers, value: string) => setPrayers((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">শুভ সকাল ফটোকার্ড</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/scrapers"><ArrowLeft className="h-4 w-4" /> ফিরে যান</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={ratio === "1:1" ? "default" : "outline"} onClick={() => setRatio("1:1")}>
                <Square className="h-4 w-4" /> ১:১
              </Button>
              <Button variant={ratio === "4:5" ? "default" : "outline"} onClick={() => setRatio("4:5")}>
                <RectangleVertical className="h-4 w-4" /> ৪:৫
              </Button>
            </div>

            <div className="space-y-2">
              <Label>টেমপ্লেট</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(templates) as Template[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemplate(t)}
                    className={`h-14 rounded-md border-2 text-[10px] font-semibold text-white transition ${template === t ? "border-primary ring-2 ring-primary/40" : "border-transparent"}`}
                    style={{ backgroundImage: templates[t].bg, backgroundSize: "cover" }}
                    title={templates[t].label}
                  >
                    {templates[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>তারিখ</Label>
              <div className="flex gap-2">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Button variant="outline" size="icon" onClick={fetchCalendar} disabled={loadingCalendar} title="অটো দিনপঞ্জি আনুন">
                  {loadingCalendar ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>হেডার</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>লোগো</Label><Input value={logo} onChange={(e) => setLogo(e.target.value)} /></div>
            </div>

            <div className="space-y-2">
              <Label>কাস্টম ব্যাকগ্রাউন্ড URL</Label>
              <Input value={background} onChange={(e) => setBackground(e.target.value)} placeholder="https://...jpg" />
            </div>

            <div className="space-y-2">
              <Label>দিনপঞ্জি</Label>
              <Textarea rows={5} value={`বাংলা: ${calendar.bangla}\nহিজরি: ${calendar.hijri}\nঋতু: ${calendar.season}\nতিথি: ${calendar.tithi}\nনক্ষত্র: ${calendar.nakshatra}`} onChange={(e) => {
                const lines = e.target.value.split("\n");
                const read = (key: string) => lines.find((line) => line.startsWith(key))?.split(":").slice(1).join(":").trim() || "—";
                setCalendar((prev) => ({ ...prev, bangla: read("বাংলা"), hijri: read("হিজরি"), season: read("ঋতু"), tithi: read("তিথি"), nakshatra: read("নক্ষত্র") }));
              }} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {([
                ["fajr", "ফজর"], ["dhuhr", "যোহর"], ["asr", "আসর"], ["maghrib", "মাগরিব"], ["isha", "ইশা"],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input value={prayers[key]} onChange={(e) => updatePrayer(key, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="space-y-2"><Label>ফুটার</Label><Input value={footer} onChange={(e) => setFooter(e.target.value)} /></div>
            <Button onClick={download} className="w-full"><Download className="h-4 w-4" /> PNG ডাউনলোড</Button>
          </CardContent>
        </Card>

        <div className="flex min-h-[720px] items-start justify-center rounded-lg border border-border bg-muted/40 p-4 md:p-8">
          <div ref={cardRef} className={`relative w-full overflow-hidden rounded-lg text-primary-foreground shadow-[var(--shadow-elevated)] ${cardSize}`} style={bgStyle}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--primary-foreground) / 0.35) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="relative flex h-full flex-col p-7 md:p-9">
              <header className="flex items-center justify-between border-b border-primary-foreground/25 pb-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal opacity-85">{logo}</p>
                  <h1 className="mt-1 text-3xl font-black md:text-4xl">{title}</h1>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15 text-3xl"><CalendarDays /></div>
              </header>

              <main className="flex flex-1 flex-col justify-center space-y-4 py-5">
                <section className="text-center">
                  <p className="text-xl font-bold">{calendar.weekday}</p>
                  <p className="mt-1 text-3xl font-black md:text-4xl">{calendar.gregorian}</p>
                </section>

                <section className="rounded-lg border border-primary-foreground/25 bg-primary-foreground/12 p-4 text-base leading-8 md:text-lg">
                  <p>🗓️ বাংলা: {calendar.bangla}</p>
                  <p>🌙 হিজরি: {calendar.hijri}</p>
                  <p>🌧️ ঋতু: {calendar.season}</p>
                </section>

                <section className="space-y-2 border-y border-primary-foreground/25 py-4 text-sm leading-7 md:text-base">
                  <h2 className="text-lg font-bold">🕉️ হিন্দু পঞ্জিকা</h2>
                  <p>• {calendar.tithi}</p>
                  <p>• বিক্রম সংবৎ: {calendar.vikram}</p>
                  <p>• নক্ষত্র: {calendar.nakshatra}</p>
                  <p>• শক সংবৎ: {calendar.shaka}</p>
                </section>

                <section className="grid grid-cols-2 gap-3 text-sm md:text-base">
                  <div className="rounded-md bg-primary-foreground/12 p-3">🌅 সূর্যোদয়: {calendar.sunrise}</div>
                  <div className="rounded-md bg-primary-foreground/12 p-3">🌇 সূর্যাস্ত: {calendar.sunset}</div>
                </section>

                <section className="rounded-lg bg-primary-foreground/12 p-4 text-sm leading-7 md:text-base">
                  <h2 className="mb-1 text-lg font-bold">🕌 নামাজের সময়সূচি</h2>
                  <div className="grid grid-cols-2 gap-x-4">
                    <p>🌄 ফজর : {prayers.fajr}</p><p>☀️ যোহর : {prayers.dhuhr}</p>
                    <p>🌤️ আসর : {prayers.asr}</p><p>🌅 মাগরিব : {prayers.maghrib}</p>
                    <p>🌙 ইশা : {prayers.isha}</p>
                  </div>
                </section>
              </main>

              <footer className="flex items-center justify-between border-t border-primary-foreground/25 pt-3 text-xs opacity-85">
                <span>{footer}</span><span>© {logo}</span>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}