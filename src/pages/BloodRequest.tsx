import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users, Filter, SlidersHorizontal, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function isDonorEligible(lastDonation: string | null): boolean {
  if (!lastDonation) return true;
  const last = new Date(lastDonation);
  const now = new Date();
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 90;
}

export default function BloodRequest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [matchedDonors, setMatchedDonors] = useState<any[]>([]);
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(true);
  const [sortBy, setSortBy] = useState("best_match");
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [form, setForm] = useState({
    patient_name: "", blood_group: "", hospital_name: "", hospital_location: "",
    urgency: "normal", units_needed: "1", contact_phone: "", notes: "",
  });

  // Supabase Email Testing Tip:
  // If you repeatedly sign up during testing and hit email rate limits, 
  // you can use Gmail aliases (e.g., myemail+donor@gmail.com, myemail+requester@gmail.com) 
  // to avoid hitting the "email already used" limit while developing locally.

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.blood_group || !form.hospital_name || !form.hospital_location) {
      toast.error("Please fill required fields");
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("blood_requests").insert({
      requester_id: user!.id,
      patient_name: form.patient_name,
      blood_group: form.blood_group,
      hospital_name: form.hospital_name,
      hospital_location: form.hospital_location,
      urgency: form.urgency,
      units_needed: parseInt(form.units_needed),
      contact_phone: form.contact_phone,
      notes: form.notes,
    });

    if (error) { toast.error(error.message); setLoading(false); return; }

    // Smart donor matching
    const { data: donors } = await supabase
      .from("donors")
      .select("*")
      .eq("blood_group", form.blood_group)
      .in("availability", form.urgency === "critical" ? ["available", "emergency_only"] : ["available"])
      .order("last_donation_date", { ascending: true, nullsFirst: true });

    setMatchedDonors(donors ?? []);
    setSubmitted(true);
    setLoading(false);
    toast.success("Blood request created! Found matching donors.");
  };

  const displayedDonors = matchedDonors
    .filter((d) => (filterEligibleOnly ? isDonorEligible(d.last_donation_date) : true))
    .sort((a, b) => {
      if (sortBy === "best_match") return (b.points || 0) - (a.points || 0); // Sort by highest points
      
      const dateA = a.last_donation_date ? new Date(a.last_donation_date).getTime() : 0;
      const dateB = b.last_donation_date ? new Date(b.last_donation_date).getTime() : 0;
      
      if (sortBy === "recent") return dateB - dateA; // Most recent first
      if (sortBy === "oldest") return dateA - dateB; // Oldest first
      return 0;
    });

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-xl">Request Blood</CardTitle>
                <CardDescription>Submit a blood request and find matching donors</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Patient Name *</Label>
                  <Input value={form.patient_name} onChange={(e) => handleChange("patient_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Blood Group Needed *</Label>
                  <Select value={form.blood_group} onValueChange={(v) => handleChange("blood_group", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{bloodGroups.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hospital Name *</Label>
                  <Input value={form.hospital_name} onChange={(e) => handleChange("hospital_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hospital Location *</Label>
                  <Input value={form.hospital_location} onChange={(e) => handleChange("hospital_location", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <Select value={form.urgency} onValueChange={(v) => handleChange("urgency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Units Needed</Label>
                  <Input type="number" min="1" value={form.units_needed} onChange={(e) => handleChange("units_needed", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={form.contact_phone} onChange={(e) => handleChange("contact_phone", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Additional information..." />
              </div>
              <Button type="submit" className="w-full" disabled={loading || submitted}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitted ? "Request Submitted" : "Submit Request & Find Donors"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {submitted && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg whitespace-nowrap">
                <Users className="h-5 w-5 text-primary" />
                Matched Donors ({displayedDonors.length})
              </CardTitle>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="eligible-only" 
                    checked={filterEligibleOnly}
                    onCheckedChange={setFilterEligibleOnly}
                  />
                  <Label htmlFor="eligible-only" className="text-sm cursor-pointer whitespace-nowrap text-muted-foreground flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    Eligible Only (≥90 days)
                  </Label>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SlidersHorizontal className="h-3 w-3 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_match">Best Match</SelectItem>
                    <SelectItem value="recent">Most Recent Donation</SelectItem>
                    <SelectItem value="oldest">Oldest Donation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayedDonors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No donors found matching the current criteria.</p>
              ) : displayedDonors.map((d) => (
                <div key={d.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-border p-4 gap-4 hover:border-primary/50 transition-colors bg-card">
                  <div>
                    <p className="font-semibold">{d.full_name}</p>
                    <p className="text-sm text-muted-foreground">{d.city} · {d.phone}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <Badge variant="outline" className="font-mono">{d.blood_group}</Badge>
                    <Badge className={d.availability === "available" ? "bg-success hover:bg-success text-success-foreground" : "bg-warning hover:bg-warning text-warning-foreground"}>
                      {d.availability.replace("_", " ")}
                    </Badge>
                    {!isDonorEligible(d.last_donation_date) && (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">Ineligible</Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSelectedDonor(d);
                        setDetailsOpen(true);
                      }}
                      className="ml-2 gap-1 text-primary"
                    >
                      <Eye className="h-4 w-4" /> View Details
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Donor Details</DialogTitle>
          </DialogHeader>
          {selectedDonor && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold font-heading">
                  {selectedDonor.blood_group}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedDonor.full_name}</h3>
                  <p className="text-muted-foreground">{selectedDonor.city}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Contact Number</p>
                  <p className="font-medium">{selectedDonor.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Email Address</p>
                  <p className="font-medium truncate" title={selectedDonor.email}>{selectedDonor.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Availability</p>
                  <Badge className={selectedDonor.availability === 'available' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                    {selectedDonor.availability.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Eligibility</p>
                  {isDonorEligible(selectedDonor.last_donation_date) ? (
                    <Badge variant="outline" className="text-success border-success/30">Eligible to Donate</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Recently Donated</Badge>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-muted-foreground text-xs">Last Donation Date</p>
                  <p className="font-medium">{selectedDonor.last_donation_date ? new Date(selectedDonor.last_donation_date).toLocaleDateString() : 'No prior donations recorded'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
