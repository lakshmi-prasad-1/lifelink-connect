import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star } from "lucide-react";

export default function Leaderboard() {
  const [donors, setDonors] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("donors").select("*").order("points", { ascending: false }).limit(50).then(({ data }) => setDonors(data ?? []));
  }, []);

  const getBadgeInfo = (points: number) => {
    if (points >= 100) return { label: "Blood Champion", icon: Trophy, color: "text-warning" };
    if (points >= 50) return { label: "Community Hero", icon: Award, color: "text-info" };
    if (points >= 30) return { label: "Life Saver", icon: Medal, color: "text-success" };
    return { label: "Donor", icon: Star, color: "text-muted-foreground" };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Donation Leaderboard</h1>
          <p className="text-muted-foreground">Top donors making a difference</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {donors.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No donors yet. Be the first!</p>
              ) : donors.map((donor, i) => {
                const badge = getBadgeInfo(donor.points);
                const Icon = badge.icon;
                return (
                  <div key={donor.id} className="flex items-center gap-4 p-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                      i === 0 ? "bg-warning/20 text-warning" : i === 1 ? "bg-muted text-muted-foreground" : i === 2 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{donor.full_name}</p>
                      <p className="text-xs text-muted-foreground">{donor.city} · {donor.total_donations} donations</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 text-xs ${badge.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {badge.label}
                      </div>
                      <Badge variant="outline" className="font-mono">{donor.blood_group}</Badge>
                      <Badge className="bg-primary">{donor.points} pts</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
