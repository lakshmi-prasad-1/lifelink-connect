import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tent, MapPin, Calendar, Clock, Users, Loader2, Search, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function DonationCamps() {
  const { user } = useAuth();
  const [camps, setCamps] = useState<any[]>([]);
  const [registeredCamps, setRegisteredCamps] = useState<Set<string>>(new Set());
  const [registering, setRegistering] = useState<string | null>(null);

  // Search State
  const [searchLocation, setSearchLocation] = useState("");

  // Create Camp State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "", organizer: "", organization: "", location: "", city: "",
    contact_phone: "", date: "", start_time: "", end_time: "", description: "", max_registrations: ""
  });

  useEffect(() => {
    fetchCamps();
  }, [user]);

  const fetchCamps = async () => {
    const { data: campsData } = await supabase
      .from("donation_camps")
      .select("*")
      .gte("camp_date", new Date().toISOString().split("T")[0])
      .order("camp_date");
    setCamps(campsData ?? []);

    if (user) {
      const { data: regs } = await supabase.from("camp_registrations").select("camp_id").eq("user_id", user.id);
      setRegisteredCamps(new Set((regs ?? []).map((r: {camp_id: string}) => r.camp_id)));
    }
  };

  const handleRegister = async (campId: string) => {
    if (!user) {
      toast.error("You must be logged in to register");
      return;
    }
    setRegistering(campId);
    const { error } = await supabase.from("camp_registrations").insert({ camp_id: campId, user_id: user.id });
    setRegistering(null);
    if (error) {
      if (error.code === "23505") toast.info("Already registered");
      else toast.error(error.message);
    } else {
      toast.success("Registered for camp!");
      setRegisteredCamps(prev => new Set(prev).add(campId));
      fetchCamps(); // to maybe increment current_registrations if we tracked that with a trigger
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a camp");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("donation_camps").insert({
        name: formData.name,
        organizer: formData.organization ? `${formData.organizer} (${formData.organization})` : formData.organizer,
        location: formData.location,
        city: formData.city,
        contact_phone: formData.contact_phone,
        camp_date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        description: formData.description || null,
        max_registrations: formData.max_registrations ? parseInt(formData.max_registrations) : null,
        current_registrations: 0
      });

      if (error) throw error;
      toast.success("Blood donation camp created successfully!");
      setFormData({
        name: "", organizer: "", organization: "", location: "", city: "",
        contact_phone: "", date: "", start_time: "", end_time: "", description: "", max_registrations: ""
      });
      fetchCamps();
    } catch (error: any) {
      toast.error(error.message || "Failed to create camp");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredCamps = searchLocation
    ? camps.filter(c => 
        c.location?.toLowerCase().includes(searchLocation.toLowerCase()) || 
        c.city?.toLowerCase().includes(searchLocation.toLowerCase())
      )
    : camps;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Tent className="h-6 w-6 text-primary" />
            Blood Donation Camps
          </h1>
          <p className="text-muted-foreground">Find upcoming camps or organize your own</p>
        </div>

        <Tabs defaultValue="find" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="find">Find Nearby Camps</TabsTrigger>
            <TabsTrigger value="create">Create Blood Camp</TabsTrigger>
          </TabsList>

          <TabsContent value="find" className="space-y-4 mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search camps by city or location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="pl-9"
              />
            </div>

            {filteredCamps.length === 0 ? (
              <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No upcoming camps found</CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredCamps.map((camp) => (
                  <Card key={camp.id} className="transition-shadow hover:shadow-md h-full flex flex-col">
                    <CardHeader className="pb-2 border-b bg-muted/10">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Tent className="h-4 w-4 text-primary shrink-0" />
                        {camp.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Organized by <span className="font-medium text-foreground">{camp.organizer}</span></p>
                    </CardHeader>
                    <CardContent className="pt-4 flex-grow space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground grid grid-cols-1">
                        <p className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <span>{camp.location}{camp.city ? `, ${camp.city}` : ''}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-primary" />
                            {format(new Date(camp.camp_date), "MMM d, yyyy")}
                          </p>
                          {camp.start_time && (
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4 shrink-0 text-primary" />
                              {camp.start_time}{camp.end_time ? ` - ${camp.end_time}` : ""}
                            </p>
                          )}
                        </div>
                        {camp.max_registrations && (
                          <p className="flex items-center gap-2">
                            <Users className="h-4 w-4 shrink-0 text-primary" />
                            {camp.current_registrations ?? 0} / {camp.max_registrations} Donors Registered
                          </p>
                        )}
                      </div>
                      {camp.description && <p className="text-sm border-t pt-3 text-foreground/80">{camp.description}</p>}
                    </CardContent>
                    <div className="p-4 pt-0">
                      <Button
                        className="w-full"
                        variant={registeredCamps.has(camp.id) ? "outline" : "default"}
                        disabled={registeredCamps.has(camp.id) || registering === camp.id}
                        onClick={() => handleRegister(camp.id)}
                      >
                        {registering === camp.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {registeredCamps.has(camp.id) ? "Registered ✓" : "Register Now"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  Organize a Blood Camp
                </CardTitle>
                <CardDescription>Fill out the details below to list your donation camp.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Camp Name *</Label>
                      <Input id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Life Savers Mega Camp" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Number *</Label>
                      <Input id="contact_phone" name="contact_phone" required value={formData.contact_phone} onChange={handleChange} placeholder="e.g. +91 9876543210" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizer">Organizer Name *</Label>
                      <Input id="organizer" name="organizer" required value={formData.organizer} onChange={handleChange} placeholder="Person in charge" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization Name</Label>
                      <Input id="organization" name="organization" value={formData.organization} onChange={handleChange} placeholder="NGO, Hospital, College..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Specific Location *</Label>
                      <Input id="location" name="location" required value={formData.location} onChange={handleChange} placeholder="Venue or Street name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" name="city" required value={formData.city} onChange={handleChange} placeholder="e.g. Vijayawada" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input id="date" name="date" type="date" required value={formData.date} onChange={handleChange} min={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start Time *</Label>
                        <Input id="start_time" name="start_time" type="time" required value={formData.start_time} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time">End Time</Label>
                        <Input id="end_time" name="end_time" type="time" value={formData.end_time} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_registrations">Maximum Donors Allowed</Label>
                      <Input id="max_registrations" name="max_registrations" type="number" min="1" value={formData.max_registrations} onChange={handleChange} placeholder="Leave empty if no limit" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Camp Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Provide useful details about the camp..." className="min-h-24" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? "Publishing..." : "Submit Camp Details"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
