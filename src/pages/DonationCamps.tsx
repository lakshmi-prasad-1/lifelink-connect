import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tent, MapPin, Calendar, Clock, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function DonationCamps() {
  const { user } = useAuth();
  const [camps, setCamps] = useState<any[]>([]);
  const [registeredCamps, setRegisteredCamps] = useState<Set<string>>(new Set());
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: campsData } = await supabase.from("donation_camps").select("*").gte("camp_date", new Date().toISOString().split("T")[0]).order("camp_date");
      setCamps(campsData ?? []);

      if (user) {
        const { data: regs } = await supabase.from("camp_registrations").select("camp_id").eq("user_id", user.id);
        setRegisteredCamps(new Set((regs ?? []).map(r => r.camp_id)));
      }
    }
    load();
  }, [user]);

  const handleRegister = async (campId: string) => {
    setRegistering(campId);
    const { error } = await supabase.from("camp_registrations").insert({ camp_id: campId, user_id: user!.id });
    setRegistering(null);
    if (error) {
      if (error.code === "23505") toast.info("Already registered");
      else toast.error(error.message);
    } else {
      toast.success("Registered for camp!");
      setRegisteredCamps(prev => new Set(prev).add(campId));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Donation Camps</h1>
          <p className="text-muted-foreground">Upcoming blood donation camps near you</p>
        </div>

        {camps.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No upcoming camps</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {camps.map((camp) => (
              <Card key={camp.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tent className="h-4 w-4 text-primary" />
                    {camp.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Organized by {camp.organizer}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{camp.location}</p>
                    <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{format(new Date(camp.camp_date), "PPP")}</p>
                    {camp.start_time && (
                      <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{camp.start_time}{camp.end_time ? ` - ${camp.end_time}` : ""}</p>
                    )}
                    {camp.max_registrations && (
                      <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{camp.current_registrations ?? 0}/{camp.max_registrations} registered</p>
                    )}
                  </div>
                  {camp.description && <p className="text-xs text-muted-foreground">{camp.description}</p>}
                  <Button
                    className="w-full"
                    variant={registeredCamps.has(camp.id) ? "outline" : "default"}
                    disabled={registeredCamps.has(camp.id) || registering === camp.id}
                    onClick={() => handleRegister(camp.id)}
                  >
                    {registering === camp.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {registeredCamps.has(camp.id) ? "Registered ✓" : "Register"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
