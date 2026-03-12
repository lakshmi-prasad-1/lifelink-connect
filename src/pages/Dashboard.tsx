import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Droplets, Search, Building2, AlertTriangle, Trophy, Tent,
  Users, Activity, Clock, Heart
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ donors: 0, requests: 0, emergencies: 0, camps: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentEmergencies, setRecentEmergencies] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [donorsRes, requestsRes, emergencyRes, campsRes] = await Promise.all([
        supabase.from("donors").select("id", { count: "exact", head: true }),
        supabase.from("blood_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("emergency_posts").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("donation_camps").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        donors: donorsRes.count ?? 0,
        requests: requestsRes.count ?? 0,
        emergencies: emergencyRes.count ?? 0,
        camps: campsRes.count ?? 0,
      });

      const { data: reqs } = await supabase.from("blood_requests").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(5);
      setRecentRequests(reqs ?? []);

      const { data: ems } = await supabase.from("emergency_posts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(5);
      setRecentEmergencies(ems ?? []);
    }
    load();
  }, []);

  const quickLinks = [
    { to: "/donor-registration", label: "Donate Blood", icon: Droplets, desc: "Register as a donor" },
    { to: "/blood-request", label: "Request Blood", icon: Search, desc: "Create a blood request" },
    { to: "/blood-banks", label: "Blood Banks", icon: Building2, desc: "Find blood banks" },
    { to: "/emergency-feed", label: "Emergency Feed", icon: AlertTriangle, desc: "View emergencies" },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy, desc: "Top donors" },
    { to: "/donation-camps", label: "Find Camps", icon: Tent, desc: "Upcoming camps" },
  ];

  const urgencyColor = (u: string) => {
    if (u === "critical") return "bg-emergency text-emergency-foreground";
    if (u === "urgent") return "bg-warning text-warning-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Registered Donors", value: stats.donors, icon: Users, color: "text-primary", link: "/registered-donors" },
            { label: "Open Requests", value: stats.requests, icon: Activity, color: "text-secondary", link: "/open-requests" },
            { label: "Active Emergencies", value: stats.emergencies, icon: AlertTriangle, color: "text-emergency", link: "/emergency-feed" },
            { label: "Upcoming Camps", value: stats.camps, icon: Tent, color: "text-success", link: "/donation-camps" },
          ].map((s) => (
            <Link key={s.label} to={s.link}>
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {quickLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <div className="mb-2 rounded-full bg-primary/10 p-3">
                    <l.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Requests & Emergencies */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-4 w-4 text-primary" />
                Recent Blood Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open requests</p>
              ) : recentRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{r.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{r.hospital_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{r.blood_group}</Badge>
                    <Badge className={urgencyColor(r.urgency)}>{r.urgency}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-4 w-4 text-emergency" />
                Emergency Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEmergencies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active emergencies</p>
              ) : recentEmergencies.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.location}</p>
                  </div>
                  <Badge className={urgencyColor(e.urgency)}>{e.urgency}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
