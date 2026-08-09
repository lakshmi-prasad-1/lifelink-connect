import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Droplet, User, Phone, Activity, Clock, Building } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getCompatibleRecipientGroups } from "@/lib/bloodMatching";

function isCompatibleDonor(donorGroup: string, recipientGroup: string): boolean {
    return getCompatibleRecipientGroups(donorGroup).includes(recipientGroup);
}

export default function OpenRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [donorBloodGroup, setDonorBloodGroup] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        if (!user) return;
        supabase.from("donors").select("blood_group").eq("user_id", user.id).maybeSingle()
            .then(({ data }) => setDonorBloodGroup(data?.blood_group ?? null));
    }, [user]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("blood_requests")
                .select("*")
                .eq("status", "open")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch blood requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        if (!user) {
            toast.error("You must be logged in to accept requests");
            return;
        }

        try {
            const { data: donor } = await supabase.from("donors").select("id, blood_group").eq("user_id", user.id).single();

            if (!donor) {
                toast.error("You need to register as a donor first.");
                return;
            }

            const request = requests.find((r) => r.id === requestId);
            if (request && !isCompatibleDonor(donor.blood_group, request.blood_group)) {
                toast.error(`Your blood type (${donor.blood_group}) isn't compatible with this request`);
                return;
            }

            const { error } = await supabase.from("donor_matches").insert({
                request_id: requestId,
                donor_id: donor.id,
                status: "accepted"
            });

            if (error) throw error;

            // Update request status to fulfilled for simple flow, or we could keep it open if it needs multiple units
            const { error: updateError } = await supabase
                .from("blood_requests")
                .update({ status: "fulfilled" })
                .eq("id", requestId);

            if (updateError) throw updateError;

            toast.success("Request accepted successfully! The requester has been notified.");
            fetchRequests(); // refresh list
        } catch (error: any) {
            toast.error(error.message || "Failed to accept request");
        }
    };

    const urgencyColor = (u: string) => {
        if (u === "critical") return "bg-emergency text-emergency-foreground";
        if (u === "urgent") return "bg-warning text-warning-foreground";
        return "bg-muted text-muted-foreground";
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold md:text-3xl flex items-center gap-2">
                        <Activity className="h-6 w-6 text-secondary" />
                        Open Blood Requests
                    </h1>
                    <p className="text-muted-foreground">Patients in need of blood donations urgently.</p>
                </div>

                {/* Requests Grid */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="h-24 bg-muted" />
                                <CardContent className="h-40" />
                            </Card>
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground flex flex-col items-center">
                        <Search className="h-12 w-12 text-muted mb-4" />
                        <p>No open blood requests found at the moment.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {requests.map((req) => (
                            <Card key={req.id} className="overflow-hidden border-t-4 border-t-secondary transition-shadow hover:shadow-md flex flex-col">
                                <CardHeader className="pb-3 border-b bg-muted/10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-bold">{req.patient_name}</CardTitle>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge className={urgencyColor(req.urgency)}>{req.urgency.toUpperCase()}</Badge>
                                                <span className="text-xs text-muted-foreground flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant="outline" className="text-lg font-mono font-bold bg-secondary/10 text-secondary border-secondary/20 p-2">
                                                <Droplet className="h-4 w-4 mr-1 text-secondary" />
                                                {req.blood_group}
                                            </Badge>
                                            <span className="text-xs font-semibold text-muted-foreground">{req.units_needed} Units</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 grid gap-3 text-sm flex-grow">
                                    <div className="flex items-start gap-2">
                                        <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-semibold">{req.hospital_name}</p>
                                            <p className="text-muted-foreground text-xs">{req.hospital_location}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-border/50 pt-3 mt-1 grid grid-cols-2 gap-2 text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span className="truncate" title={req.requester_id}>Contact Person</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span>{req.contact_phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 pb-4 px-4 flex flex-col gap-2">
                                  <div className="flex w-full gap-2">
                                    {donorBloodGroup && !isCompatibleDonor(donorBloodGroup, req.blood_group) ? (
                                        <Button className="flex-1" variant="outline" disabled title={`Your blood type (${donorBloodGroup}) can't safely donate to a ${req.blood_group} patient`}>
                                            Not a Match
                                        </Button>
                                    ) : (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                                                Accept Request
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Accept this blood request?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    You're committing to donate {req.blood_group} blood for {req.patient_name} at {req.hospital_name}
                                                    {donorBloodGroup ? ` as a ${donorBloodGroup} donor` : ""}. This marks the request as fulfilled for everyone else, so only accept if you can actually donate soon.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleAcceptRequest(req.id)}>
                                                    Yes, Accept
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    )}
                                    <Button variant="outline" className="flex-1">
                                        View Details
                                    </Button>
                                  </div>
                                  {donorBloodGroup && !isCompatibleDonor(donorBloodGroup, req.blood_group) && (
                                    <p className="text-xs text-muted-foreground text-center">
                                      Your blood type ({donorBloodGroup}) isn't compatible with this request
                                    </p>
                                  )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
