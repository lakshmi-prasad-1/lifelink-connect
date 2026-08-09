import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Heart, LayoutDashboard, Droplets, Search, Building2, AlertTriangle,
  Trophy, Tent, LogOut, Menu, X, User, Inbox
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/donor-registration", label: "Donate Blood", icon: Droplets },
  { to: "/blood-request", label: "Request Blood", icon: Search },
  { to: "/blood-banks", label: "Blood Banks", icon: Building2 },
  { to: "/matching-requests", label: "Matching Requests", icon: Inbox },
  { to: "/emergency-feed", label: "Emergency Feed", icon: AlertTriangle },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/donation-camps", label: "Camps", icon: Tent },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const current = navItems.find((item) => item.to === location.pathname);
    document.title = current ? `${current.label} · LifeLink AI` : "LifeLink AI";
  }, [location.pathname]);

  // App-wide broadcast: alert whoever's logged in, wherever they are, the
  // instant a critical emergency post goes up (the Emergency Feed page
  // itself shows the same event inline, so it's skipped here to avoid a
  // duplicate toast).
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("app-emergency-broadcast")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emergency_posts", filter: "urgency=eq.critical" },
        (payload) => {
          if (location.pathname === "/emergency-feed") return;
          const post = payload.new as Tables<"emergency_posts">;
          toast.error(`Critical: ${post.title}`, {
            description: post.location || "Check the Emergency Feed for details",
            action: { label: "View", onClick: () => navigate("/emergency-feed") },
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/signin");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-card border-r border-border">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold">LifeLink AI</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-3 py-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold">LifeLink AI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {mobileOpen && (
          <div className="absolute inset-0 z-50 bg-card lg:hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-heading font-bold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Button variant="ghost" className="w-full justify-start gap-3 mt-4 text-muted-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
