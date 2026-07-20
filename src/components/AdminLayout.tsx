import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, PlusCircle, Link2, Image, LogOut, Home, Menu, X, Tag, User, FolderOpen, Rss, Settings2, Bug,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "ড্যাশবোর্ড", icon: LayoutDashboard, path: "/admin" },
  { label: "পোস্ট সমূহ", icon: FileText, path: "/admin/posts" },
  { label: "কুইক পোস্ট", icon: PlusCircle, path: "/admin/quick-post" },
  { label: "URL পোস্ট", icon: Link2, path: "/admin/url-post" },
  { label: "এডিটর পোস্ট", icon: FileText, path: "/admin/editor-post" },
  { label: "মিডিয়া", icon: Image, path: "/admin/media" },
  { label: "ট্যাগ ও ম্যাপ", icon: Tag, path: "/admin/tags" },
  { label: "ক্যাটেগরি", icon: FolderOpen, path: "/admin/categories" },
  { label: "RSS ফিড", icon: Rss, path: "/admin/rss-feeds" },
  { label: "সাইট কাস্টমাইজ", icon: Settings2, path: "/admin/site-customizer" },
  { label: "স্ক্র্যাপার হাব", icon: Bug, path: "/admin/scrapers" },
  { label: "প্রোফাইল", icon: User, path: "/admin/profile" },
];

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setRoleLoading(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator", "editor"] as any)
      .limit(1)
      .then(({ data }) => {
        setCanAccessAdmin(!!data?.length);
        setRoleLoading(false);
      });
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="text-xl font-display font-bold">
            <span className="text-primary">AHAi</span>WEB
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <Home className="h-4 w-4" /> হোমপেজে যান
          </Link>
          <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full">
            <LogOut className="h-4 w-4" /> লগআউট
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">অ্যাডমিন প্যানেল</h1>
          <span className="ml-auto text-xs text-muted-foreground">{user.email}</span>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
