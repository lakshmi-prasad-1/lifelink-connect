import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { getCompatibleDonorGroups, normalizeLocation } from "@/lib/bloodMatching";

export default function RequestResponses() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalNotified: 0,
    accepted: 0,
    declined: 0,
    pending: 0,
  });

  useEffect(() => {
    if (user) {
      fetchResponses();
    }
  }, [user]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      // 1. Fetch user's blood requests
      const { data: userRequests, error: reqError } = await supabase
        .from("blood_requests")
        .select("id, blood_group, hospital_location, urgency")
        .eq("requester_id", user!.id);

      if (reqError) throw reqError;

      // Calculate total notified donors
      let totalNotifiedCount = 0;
      for (const req of userRequests || []) {
        const eligibleGroups = getCompatibleDonorGroups(req.blood_group);
        const allowedAvailability = req.urgency === "critical" ? ["available", "emergency_only"] : ["available"];
        const { data: donors, error: countError } = await supabase
          .from("donors")
          .select("id, city")
          .in("blood_group", eligibleGroups)
          .in("availability", allowedAvailability)
          .neq("user_id", user!.id);
        
        if (!countError && donors) {
          const normalizedRequestCity = normalizeLocation(req.hospital_location);
          totalNotifiedCount += donors.filter((donor) => normalizeLocation(donor.city) === normalizedRequestCity).length;
        }
      }
      
      setStats((prev) => ({ ...prev, totalNotified: totalNotifiedCount }));

      const requestIds = userRequests?.map((r) => r.id) || [];

      if (requestIds.length === 0) {
        setResponses([]);
        setLoading(false);
        return;
      }

      // 2. Fetch donor responses for these requests from existing donor_matches table
      const { data: responsesData, error: respError } = await supabase
        .from("donor_matches")
        .select(`
          *,
          donors (
            full_name,
            blood_group,
            city,
            phone,
            latitude,
            longitude
          ),
          blood_requests (
            hospital_latitude,
            hospital_longitude
          )
        `)
        .in("request_id", requestIds)
        .order("created_at", { ascending: false });

      if (respError) throw respError;

      // Also calculate pending by looking at donor_matches or total matching vs responded?
      // Requirement: "Pending -> yellow label". For MVP, let's just see if there are explicitly 'Pending' stated, or we treat missing responses as pending if we track them.
      // But we just query what's in donor_responses. Wait, pending responses might be records inserted explicitly with 'Pending' status.
      
      let acceptedCount = 0;
      let declinedCount = 0;
      let pendingCount = 0;

      const mappedResponses = responsesData?.map(r => {
        let mappedStatus = "Pending";
        if (r.status === "accepted") mappedStatus = "Accepted";
        else if (r.status === "rejected") mappedStatus = "Declined";

        return { ...r, mappedStatus };
      }) || [];

      mappedResponses.forEach((r) => {
        if (r.mappedStatus === "Accepted") acceptedCount++;
        else if (r.mappedStatus === "Declined") declinedCount++;
        else pendingCount++;
      });

      setStats((prev) => ({
        ...prev,
        accepted: acceptedCount,
        declined: declinedCount,
        pending: totalNotifiedCount - (acceptedCount + declinedCount) > 0 
          ? totalNotifiedCount - (acceptedCount + declinedCount) 
          : 0,
      }));

      setResponses(mappedResponses);
    } catch (error: any) {
      toast.error("Failed to load responses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "Unknown";
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d.toFixed(1) + " km";
  };

  const getStatusBadge = (status: string) => {
    if (status === "Accepted") return <Badge className="bg-success hover:bg-success/90">Accepted</Badge>;
    if (status === "Declined") return <Badge variant="destructive">Declined</Badge>;
    return <Badge className="bg-warning hover:bg-warning/90 text-warning-foreground">Pending</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Request Responses</h1>
          <p className="text-muted-foreground">
            Track donor responses to your blood requests in real time.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Donors Notified</p>
                <h3 className="text-2xl font-bold">{stats.totalNotified}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-success/10 rounded-full text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accepted Donors</p>
                <h3 className="text-2xl font-bold">{stats.accepted}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Declined Donors</p>
                <h3 className="text-2xl font-bold">{stats.declined}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-warning/10 rounded-full text-warning-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Responses</p>
                <h3 className="text-2xl font-bold">{stats.pending}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Display Table */}
        <Card>
          <CardHeader>
            <CardTitle>Donor Responses</CardTitle>
            <CardDescription>Detailed overview of all donor responses for your active requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/20">
                <p>No donor responses to display yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Donor Name</th>
                      <th className="px-4 py-3 font-medium">Blood Group</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Phone Number</th>
                      <th className="px-4 py-3 font-medium">Distance</th>
                      <th className="px-4 py-3 font-medium">Response Status</th>
                      <th className="px-4 py-3 font-medium">Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((resp) => {
                      const donor = resp.donors;
                      const req = resp.blood_requests;
                      return (
                        <tr key={resp.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{donor?.full_name || "Unknown"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono">{donor?.blood_group || "Unknown"}</Badge>
                          </td>
                          <td className="px-4 py-3">{resp.mappedStatus === "Accepted" ? donor?.city || "Unknown" : "Hidden"}</td>
                          <td className="px-4 py-3">{resp.mappedStatus === "Accepted" ? donor?.phone || "N/A" : "Hidden"}</td>
                          <td className="px-4 py-3">
                            {resp.mappedStatus === "Accepted" ? calculateDistance(
                              donor?.latitude, donor?.longitude, 
                              req?.hospital_latitude, req?.hospital_longitude
                            ) : "Hidden"}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(resp.mappedStatus)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(resp.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
