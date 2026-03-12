import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, Hospital, User, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function MatchingRequests() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [donor, setDonor] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch donor profile
      const { data: donorData, error: donorError } = await supabase
        .from("donors")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (donorError) throw donorError;

      if (!donorData) {
        setLoading(false);
        return;
      }
      setDonor(donorData);

      // Define compatible blood groups for donor
      const getCompatibleBloodGroups = (donorGroup: string) => {
        const map: Record<string, string[]> = {
          "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
          "O+": ["O+", "A+", "B+", "AB+"],
          "A-": ["A-", "A+", "AB-", "AB+"],
          "A+": ["A+", "AB+"],
          "B-": ["B-", "B+", "AB-", "AB+"],
          "B+": ["B+", "AB+"],
          "AB-": ["AB-", "AB+"],
          "AB+": ["AB+"]
        };
        return map[donorGroup] || [donorGroup];
      };

      const compatibleGroups = getCompatibleBloodGroups(donorData.blood_group);

      // 2. Fetch matching requests based on compatible blood groups and city
      const { data: requestData, error: requestError } = await supabase
        .from("blood_requests")
        .select("*")
        .in("blood_group", compatibleGroups)
        .eq("hospital_location", donorData.city)
        .order("created_at", { ascending: false });

      if (requestError) throw requestError;

      // 3. Fetch existing matches for this donor
      const { data: matchData, error: matchError } = await supabase
        .from("donor_matches")
        .select("*")
        .eq("donor_id", donorData.id);

      if (matchError) throw matchError;

      const matchMap: Record<string, string> = {};
      matchData?.forEach((m) => {
        matchMap[m.request_id] = m.status;
      });

      setMatches(matchMap);

      // Filter to only 'pending' requests or undefined default open ones 
      // where the user hasn't rejected them or accepted them (or we can show them with status)
      const openRequests = requestData?.filter(r => r.status === 'pending' || !r.status || r.status === 'open') || [];
      setRequests(openRequests);

    } catch (error: any) {
      toast.error("Failed to load requests: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: "accepted" | "rejected") => {
    if (!donor) return;

    try {
      // Check if match record already exists to bypass unique constraint issues on upsert
      const { data: existing } = await supabase
        .from("donor_matches")
        .select("id")
        .eq("request_id", requestId)
        .eq("donor_id", donor.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("donor_matches")
          .update({ status: action })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("donor_matches")
          .insert({
            request_id: requestId,
            donor_id: donor.id,
            status: action
          });
        if (error) throw error;
      }

      toast.success(`Request ${action} successfully`);
      setMatches((prev) => ({ ...prev, [requestId]: action }));
    } catch (error: any) {
      toast.error("Failed to process action: " + error.message);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Matching Requests</h1>
          <p className="text-muted-foreground">
            Blood requests in your city that match your blood type.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !donor ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <CardTitle className="mb-2">Donor Profile Required</CardTitle>
                <CardDescription>
                  You need to register as a donor to view and accept matching blood requests.
                </CardDescription>
              </div>
              <Button onClick={() => window.location.href = "/donor-registration"}>
                Register as Donor
              </Button>
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
              <p>No matching requests found in {donor.city} for blood type {donor.blood_group}.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => {
              const matchStatus = matches[req.id];
              const isHandled = !!matchStatus;

              return (
                <Card key={req.id} className={`transition-all ${isHandled ? 'opacity-70 bg-muted/50' : 'hover:border-primary/50'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          {req.patient_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <AlertCircle className={`h-4 w-4 ${req.urgency === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                          {req.urgency?.charAt(0).toUpperCase() + req.urgency?.slice(1)} Urgency
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="font-mono text-lg px-3 py-1 bg-primary text-primary-foreground">
                          {req.blood_group}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                          {req.units_needed} Unit{req.units_needed !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Hospital className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">{req.hospital_name}</span>
                          <br />
                          {req.hospital_location}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        {req.contact_phone || "Not provided"}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 justify-between">
                    <div>
                      {matchStatus === "accepted" && (
                        <Badge variant="default" className="bg-success hover:bg-success text-success-foreground gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Accepted
                        </Badge>
                      )}
                      {matchStatus === "rejected" && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Rejected
                        </Badge>
                      )}
                    </div>

                    {!isHandled && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleAction(req.id, "rejected")}
                        >
                          Reject
                        </Button>
                        <Button
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => handleAction(req.id, "accepted")}
                        >
                          Accept Request
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
