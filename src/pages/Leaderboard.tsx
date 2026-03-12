import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star } from "lucide-react";

export default function Leaderboard() {
  const [donors, setDonors] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("donors")
      .select("*")
      .order("points", { ascending: false })
      .order("total_donations", { ascending: false })
      .limit(50)
      .then(({ data }) => setDonors(data ?? []));
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
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-warning" />
            Donation Leaderboard
          </h1>
          <p className="text-muted-foreground">Top donors making a difference in our community</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {donors.length === 0 ? (
                <p className="p-12 text-center text-muted-foreground">No donors yet. Be the first to save a life!</p>
              ) : (
                <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_2fr_1fr_1fr_1fr_1fr] bg-muted/20 p-4 font-semibold text-sm text-muted-foreground border-b hidden md:grid">
                  <div className="w-10 text-center">Rank</div>
                  <div className="pl-2">Donor Details</div>
                  <div>Blood Group</div>
                  <div className="text-center">Donations</div>
                  <div className="text-center">Lives Saved</div>
                  <div className="text-right pr-2">Points</div>
                </div>
              )}
              {donors.map((donor, i) => {
                const badge = getBadgeInfo(donor.points);
                const Icon = badge.icon;
                return (
                  <div key={donor.id} className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_2fr_1fr_1fr_1fr_1fr] gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-center w-10">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${i === 0 ? "bg-amber-100 text-amber-600 ring-4 ring-amber-100/50" :
                          i === 1 ? "bg-slate-200 text-slate-600" :
                            i === 2 ? "bg-orange-100 text-orange-600" :
                              "bg-muted text-muted-foreground"
                        }`}>
                        {i + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate">{donor.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 truncate">
                        <span>{donor.city}</span>
                        <span className="hidden md:inline">•</span>
                        <div className={`hidden md:flex flex items-center gap-1 font-medium ${badge.color}`}>
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center">
                      <Badge className="font-mono text-sm px-2 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                        {donor.blood_group}
                      </Badge>
                    </div>

                    <div className="hidden md:flex justify-center flex-col items-center">
                      <span className="text-lg font-bold">{donor.total_donations}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider md:hidden">donations</span>
                    </div>

                    <div className="hidden md:flex justify-center flex-col items-center">
                      <span className="text-lg font-bold text-destructive flex items-center">
                        {donor.total_donations}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider md:hidden">lives</span>
                    </div>

                    <div className="flex flex-col items-end justify-center">
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-3 py-1">
                        {donor.points} <span className="text-[10px] ml-1 opacity-80 uppercase tracking-wider">pts</span>
                      </Badge>
                      <div className="md:hidden flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{donor.blood_group}</span> •
                        <span>{donor.total_donations} don.</span>
                      </div>
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
