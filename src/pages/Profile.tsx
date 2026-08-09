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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { user } = useAuth();
  const [donor, setDonor] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingDonation, setLoggingDonation] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: donorData, error } = await supabase.from("donors").select("*").eq("user_id", user.id).maybeSingle();
    setDonor(donorData);
    if (error) console.error(error);

    if (donorData) {
      const { data: donationsData } = await supabase.from("donations").select("*").eq("donor_id", donorData.id).order("donation_date", { ascending: false });
      setDonations(donationsData ?? []);
    }
    setLoading(false);
  };

  const updateAvailability = async (value: string) => {
    const { error } = await supabase.from("donors").update({ availability: value }).eq("user_id", user!.id);
    if (error) toast.error(error.message);
    else { toast.success("Availability updated"); setDonor((p: any) => ({ ...p, availability: value })); }
  };

  const handleLogDonation = async () => {
    if (!donor) return;
    setLoggingDonation(true);
    try {
      // Create new donation record
      const newDonation = {
        donor_id: donor.id,
        donation_date: new Date().toISOString(),
        units: 1,
        verified: true // Assuming self-logging is verified for demo
      };
      const { error: insertError } = await supabase.from("donations").insert(newDonation);
      if (insertError) throw insertError;

      // Update donor stats
      const newTotalDonations = (donor.total_donations || 0) + 1;
      const newPoints = (donor.points || 0) + 10;
      const { error: updateError } = await supabase
        .from("donors")
        .update({
          total_donations: newTotalDonations,
          points: newPoints,
          last_donation_date: new Date().toISOString()
        })
        .eq("id", donor.id);

      if (updateError) throw updateError;

      toast.success("Donation logged successfully! +10 Points");
      loadData(); // Refresh data
    } catch (error: any) {
      toast.error("Failed to log donation: " + error.message);
    } finally {
      setLoggingDonation(false);
    }
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

  const nextEligibleDate = () => {
    if (!donor?.last_donation_date) return "Now";
    const date = new Date(donor.last_donation_date);
    date.setDate(date.getDate() + 90);
    return date.toLocaleDateString();
  };

  const badgeTiers = [
    { threshold: 0, label: "Donor", icon: Star },
    { threshold: 30, label: "Life Saver", icon: Medal },
    { threshold: 50, label: "Community Hero", icon: Award },
    { threshold: 100, label: "Blood Champion", icon: Trophy },
  ];

  const getBadge = (points: number) => {
    return [...badgeTiers].reverse().find((tier) => points >= tier.threshold)!;
  };

  const getNextTier = (points: number) => badgeTiers.find((tier) => points < tier.threshold) ?? null;

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
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <h2 className="font-heading text-xl font-bold">{donor.full_name}</h2>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        disabled={loggingDonation || !isEligible()}
                        className="mt-2 md:mt-0"
                      >
                        {loggingDonation ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                        ) : "Log New Donation"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Log a completed donation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This records that you donated {donor.blood_group} blood today, adds 10 points, and starts your 90-day recovery window before you're eligible again. Only confirm if you've actually completed a donation.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogDonation}>Confirm Donation</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{donor.email} · {donor.phone}</p>
                <p className="text-sm text-muted-foreground">{donor.city}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <Badge className="bg-primary font-mono">{donor.blood_group}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BadgeIcon className="h-3 w-3" />{badge.label}
                  </Badge>
                  {isEligible() ? (
                    <Badge className="bg-success text-success-foreground">Eligible to Donate</Badge>
                  ) : (
                    <Badge className="bg-warning text-warning-foreground" title={`Eligible on ${nextEligibleDate()}`}>
                      {daysUntilEligible()} days until eligible
                    </Badge>
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
              <p className="text-2xl font-bold">{donor.total_donations}</p>
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

        {/* Rewards Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" /> Rewards Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const nextTier = getNextTier(donor.points);
              if (!nextTier) {
                return <p className="text-sm text-muted-foreground">You've reached the top tier — Blood Champion. Thank you for saving lives!</p>;
              }
              const prevThreshold = [...badgeTiers].reverse().find((t) => donor.points >= t.threshold)?.threshold ?? 0;
              const span = nextTier.threshold - prevThreshold;
              const progress = Math.min(100, Math.round(((donor.points - prevThreshold) / span) * 100));
              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{donor.points} pts</span>
                    <span className="text-muted-foreground">{nextTier.threshold - donor.points} pts to <span className="font-medium text-foreground">{nextTier.label}</span></span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Action Track */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Schedule Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Last Donation:</span>
                <span className="font-medium">{donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Eligible:</span>
                <span className="font-medium text-primary">{nextEligibleDate()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donation History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donation History</CardTitle>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <p className="text-sm text-center py-6 text-muted-foreground border border-dashed rounded-lg">No donations recorded yet</p>
            ) : (
              <div className="space-y-3">
                {donations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Droplets className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{d.units} unit(s) donated</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.donation_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={d.verified ? "default" : "outline"} className={d.verified ? "bg-success hover:bg-success/90" : ""}>
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
