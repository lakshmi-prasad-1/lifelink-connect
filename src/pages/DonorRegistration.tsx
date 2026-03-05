import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const availabilityOptions = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "emergency_only", label: "Emergency Only" },
];

export default function DonorRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    blood_group: "",
    phone: "",
    email: user?.email ?? "",
    city: "",
    last_donation_date: "",
    availability: "available",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.blood_group || !form.phone || !form.email || !form.city) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("donors").insert({
      user_id: user!.id,
      full_name: form.full_name,
      blood_group: form.blood_group,
      phone: form.phone,
      email: form.email,
      city: form.city,
      last_donation_date: form.last_donation_date || null,
      availability: form.availability,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("You are already registered as a donor");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Registered as a donor!");
      navigate("/profile");
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-xl">Donor Registration</CardTitle>
                <CardDescription>Register to donate blood and save lives</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Blood Group *</Label>
                  <Select value={form.blood_group} onValueChange={(v) => handleChange("blood_group", v)}>
                    <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+1234567890" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <Label>Last Donation Date</Label>
                  <Input type="date" value={form.last_donation_date} onChange={(e) => handleChange("last_donation_date", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={form.availability} onValueChange={(v) => handleChange("availability", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Register as Donor
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
