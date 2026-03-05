import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Heart, Droplets, Trophy, Medal, Award, Star, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const [donor, setDonor] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data: donorData } = await supabase.from("donors").select("*").eq("user_id", user.id).maybeSingle();
      setDonor(donorData);

      if (donorData) {
        const { data: donationsData } = await supabase.from("donations").select("*").eq("donor_id", donorData.id).order("donation_date", { ascending: false });
        setDonations(donationsData ?? []);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const updateAvailability = async (value: string) => {
    const { error } = await supabase.from("donors").update({ availability: value }).eq("user_id", user!.id);
    if (error) toast.error(error.message);
    else { toast.success("Availability updated"); setDonor((p: any) => ({ ...p, availability: value })); }
  };

  const isEligible = () => {
    if (!donor?.last_donation_date) return true;
    const diff = (Date.now() - new Date(donor.last_donation_date).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 90;
  };

  const daysUntilEligible = () => {
    if (!donor?.last_donation_date) return 0;
    const diff = 90 - (Date.now() - new Date(donor.last_donation_date).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(diff));
  };

  const getBadge = (points: number) => {
    if (points >= 100) return { label: "Blood Champion", icon: Trophy };
    if (points >= 50) return { label: "Community Hero", icon: Award };
    if (points >= 30) return { label: "Life Saver", icon: Medal };
    return { label: "Donor", icon: Star };
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></AppLayout>;

  if (!donor) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <User className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">You haven't registered as a donor yet.</p>
          <Link to="/donor-registration"><Button>Register Now</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const badge = getBadge(donor.points);
  const BadgeIcon = badge.icon;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-heading text-xl font-bold">{donor.full_name}</h2>
                <p className="text-sm text-muted-foreground">{donor.email} · {donor.phone}</p>
                <p className="text-sm text-muted-foreground">{donor.city}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <Badge className="bg-primary font-mono">{donor.blood_group}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BadgeIcon className="h-3 w-3" />{badge.label}
                  </Badge>
                  {isEligible() ? (
                    <Badge className="bg-success text-success-foreground">Eligible to Donate</Badge>
                  ) : (
                    <Badge className="bg-warning text-warning-foreground">{daysUntilEligible()} days until eligible</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Droplets className="mx-auto h-6 w-6 text-primary mb-1" />
              <p className="text-2xl font-bold">{donor.total_donations}</p>
              <p className="text-xs text-muted-foreground">Donations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="mx-auto h-6 w-6 text-emergency mb-1" />
              <p className="text-2xl font-bold">{donor.total_donations * 3}</p>
              <p className="text-xs text-muted-foreground">Lives Saved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="mx-auto h-6 w-6 text-warning mb-1" />
              <p className="text-2xl font-bold">{donor.points}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </CardContent>
          </Card>
        </div>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Availability Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={donor.availability} onValueChange={updateAvailability}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="emergency_only">Emergency Only</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Donation History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donation History</CardTitle>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No donations recorded yet</p>
            ) : (
              <div className="space-y-3">
                {donations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{d.units} unit(s)</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.donation_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={d.verified ? "default" : "outline"} className={d.verified ? "bg-success" : ""}>
                      {d.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
