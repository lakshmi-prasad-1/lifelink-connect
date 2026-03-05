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
import { Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";

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
  const [form, setForm] = useState({
    patient_name: "", blood_group: "", hospital_name: "", hospital_location: "",
    urgency: "normal", units_needed: "1", contact_phone: "", notes: "",
  });

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

    const eligible = (donors ?? []).filter((d) => isDonorEligible(d.last_donation_date));
    setMatchedDonors(eligible);
    setSubmitted(true);
    setLoading(false);
    toast.success("Blood request created! Matching donors found.");
  };

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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-4 w-4 text-primary" />
                Matched Donors ({matchedDonors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {matchedDonors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No eligible donors found for {form.blood_group} currently.</p>
              ) : matchedDonors.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.city} · {d.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{d.blood_group}</Badge>
                    <Badge className={d.availability === "available" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                      {d.availability}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
