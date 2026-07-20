import { Search, Bell, Moon, Sun, Menu, Settings, LogIn, Home, CalendarDays, Star, Quote, ChevronDown, BookOpen, Library as LibraryIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const zodiacSigns = [
  { name: "মেষ", symbol: "♈" }, { name: "বৃষ", symbol: "♉" }, { name: "মিথুন", symbol: "♊" },
  { name: "কর্কট", symbol: "♋" }, { name: "সিংহ", symbol: "♌" }, { name: "কন্যা", symbol: "♍" },
  { name: "তুলা", symbol: "♎" }, { name: "বৃশ্চিক", symbol: "♏" }, { name: "ধনু", symbol: "♐" },
  { name: "মকর", symbol: "♑" }, { name: "কুম্ভ", symbol: "♒" }, { name: "মীন", symbol: "♓" },
];

const Header = () => {
  const [isDark, setIsDark] = useState(false);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = location.pathname.startsWith("/admin");
  const activeCategory = searchParams.get("category");

  const today = new Date().toISOString().split("T")[0];

  const { data: allCategories } = useQuery({
    queryKey: ["nav-categories-all"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("show_in_nav", true).order("sort_order");
      return (data || []) as any[];
    },
  });

  // Build parent-child hierarchy
  const parentCategories = allCategories?.filter((c: any) => !c.parent_id) || [];
  const getChildren = (parentId: string) => allCategories?.filter((c: any) => c.parent_id === parentId) || [];

  const { data: dailyContent } = useQuery({
    queryKey: ["daily-content", today],
    queryFn: async () => {
      const { data } = await supabase.from("daily_content").select("*").eq("date", today);
      return data || [];
    },
  });

  const onThisDay = dailyContent?.find((d: any) => d.content_type === "on_this_day")?.data as any;
  const horoscope = dailyContent?.find((d: any) => d.content_type === "horoscope")?.data as any;
  const quote = dailyContent?.find((d: any) => d.content_type === "quote")?.data as any;

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const selectedHoroscope = horoscope?.signs?.find((s: any) => s.name === selectedSign);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      {/* Ticker */}
      <div className="ticker-bar flex items-center gap-3 overflow-hidden">
        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold shrink-0">
          ব্রেকিং
        </span>
        <div className="truncate text-xs">
          আজকের শীর্ষ সংবাদ • নতুন ব্লগ পোস্ট প্রকাশিত • ভ্রমণ গাইড আপডেট হয়েছে
        </div>
      </div>
      
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="text-2xl md:text-3xl font-display font-black tracking-tight">
            <span className="text-primary">AHAi</span>
            <span className="text-foreground">WEB</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="অনুসন্ধান করুন..." className="pl-9 h-9 bg-muted border-0" />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isAdmin ? (
            <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" asChild>
              <Link to="/"><Home className="h-4 w-4" /> মূলসাইট</Link>
            </Button>
          ) : user ? (
            <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" asChild>
              <Link to="/admin"><Settings className="h-4 w-4" /> অ্যাডমিন</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" asChild>
              <Link to="/login"><LogIn className="h-4 w-4" /> লগইন</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleDark}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Category Nav */}
      {!isAdmin && (
        <nav className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto text-sm scrollbar-hide">
          <Button 
            variant={!activeCategory ? "default" : "ghost"} 
            size="sm" 
            className="shrink-0 h-7 text-xs rounded-full"
            onClick={() => setSearchParams({})}
          >
            হোম
          </Button>
          {parentCategories.map((cat: any) => {
            const children = getChildren(cat.id);
            if (children.length > 0) {
              return (
                <div key={cat.id} className="group relative shrink-0">
                  {cat.external_url ? (
                    <Button
                      variant={activeCategory === cat.slug ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs rounded-full gap-1"
                      asChild
                    >
                      <a href={cat.external_url} target="_blank" rel="noreferrer">
                        {cat.icon} {cat.name} <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant={activeCategory === cat.slug ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs rounded-full gap-1"
                      onClick={() => setSearchParams({ category: cat.slug })}
                    >
                      {cat.icon} {cat.name} <ChevronDown className="h-3 w-3" />
                    </Button>
                  )}
                  <div className="pointer-events-none invisible absolute left-0 top-full z-50 w-[min(560px,90vw)] translate-y-2 rounded-md border border-border bg-popover p-3 text-popover-foreground opacity-0 shadow-md transition-all group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100">
                    <button
                      className="w-full text-left mb-2 px-2 py-1 rounded hover:bg-muted text-xs font-bold"
                      onClick={() => setSearchParams({ category: cat.slug })}
                    >
                      সব {cat.name} →
                    </button>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-[70vh] overflow-y-auto">
                      {children.map((child: any) => (
                        child.external_url ? (
                          <a
                            key={child.id}
                            href={child.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-left px-2 py-1.5 text-xs hover:bg-muted rounded transition-colors flex items-center gap-2"
                          >
                            {child.icon && <span>{child.icon}</span>}
                            <span className="truncate">{child.name}</span>
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        ) : (
                          <button
                            key={child.id}
                            className="text-left px-2 py-1.5 text-xs hover:bg-muted rounded transition-colors flex items-center gap-2"
                            onClick={() => setSearchParams({ category: child.slug })}
                          >
                            {child.icon && <span>{child.icon}</span>}
                            <span className="truncate">{child.name}</span>
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            if (cat.external_url) {
              return (
                <Button key={cat.id} variant="ghost" size="sm" className="shrink-0 h-7 text-xs rounded-full gap-1" asChild>
                  <a href={cat.external_url} target="_blank" rel="noreferrer">{cat.icon} {cat.name} <ExternalLink className="h-3 w-3" /></a>
                </Button>
              );
            }
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.slug ? "default" : "ghost"}
                size="sm"
                className="shrink-0 h-7 text-xs rounded-full"
                onClick={() => setSearchParams({ category: cat.slug })}
              >
                {cat.icon} {cat.name}
              </Button>
            );
          })}

          <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs rounded-full gap-1" asChild>
            <Link to="/dictionary"><BookOpen className="h-3 w-3" /> অভিধান</Link>
          </Button>
          <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs rounded-full gap-1" asChild>
            <Link to="/library"><LibraryIcon className="h-3 w-3" /> লাইব্রেরি</Link>
          </Button>


          {/* আজকের দিনে Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs rounded-full gap-1">
                📅 আজকের দিনে <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-9 rounded-none rounded-t-md">
                  <TabsTrigger value="today" className="text-xs gap-1"><CalendarDays className="h-3 w-3" /> এই দিনে</TabsTrigger>
                  <TabsTrigger value="horoscope" className="text-xs gap-1"><Star className="h-3 w-3" /> রাশি</TabsTrigger>
                  <TabsTrigger value="quotes" className="text-xs gap-1"><Quote className="h-3 w-3" /> উক্তি</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="p-3 mt-0 space-y-2.5 max-h-64 overflow-y-auto">
                  {onThisDay?.events?.length ? (
                    onThisDay.events.map((e: any, i: number) => (
                      <div key={i} className="border-l-2 border-accent pl-3">
                        <p className="text-xs font-bold text-muted-foreground">{e.year}</p>
                        <p className="text-sm">{e.event}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">ডেটা লোড হচ্ছে...</p>
                  )}
                </TabsContent>

                <TabsContent value="horoscope" className="p-3 mt-0">
                  {selectedSign && selectedHoroscope ? (
                    <div>
                      <Button variant="ghost" size="sm" className="text-xs mb-2 h-6 px-2" onClick={() => setSelectedSign(null)}>← সব রাশি</Button>
                      <div className="text-center py-2">
                        <p className="text-3xl">{selectedHoroscope.symbol}</p>
                        <p className="font-medium text-sm mt-1">{selectedHoroscope.name}</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{selectedHoroscope.prediction}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {zodiacSigns.map((sign) => (
                        <button
                          key={sign.name}
                          onClick={() => setSelectedSign(sign.name)}
                          className="flex flex-col items-center p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <span className="text-lg">{sign.symbol}</span>
                          <span className="text-[10px] mt-0.5">{sign.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!horoscope?.signs && (
                    <p className="text-xs text-muted-foreground text-center py-4">ডেটা লোড হচ্ছে...</p>
                  )}
                </TabsContent>

                <TabsContent value="quotes" className="p-3 mt-0">
                  {quote?.text ? (
                    <>
                      <blockquote className="border-l-2 border-primary pl-3 italic text-sm text-muted-foreground">"{quote.text}"</blockquote>
                      <p className="text-xs text-right mt-2 text-muted-foreground">— {quote.author}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">ডেটা লোড হচ্ছে...</p>
                  )}
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </nav>
      )}
    </header>
  );
};

export default Header;
