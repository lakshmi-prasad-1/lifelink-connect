import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const bloodGroups = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function EmergencyFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    post_type: "donor_request", title: "", description: "", location: "",
    urgency: "urgent", blood_group: "", contact_phone: "",
  });

  const loadPosts = async () => {
    const { data } = await supabase.from("emergency_posts").select("*").eq("status", "active").order("created_at", { ascending: false });
    setPosts(data ?? []);
  };

  useEffect(() => { loadPosts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) { toast.error("Title and description required"); return; }
    setLoading(true);
    const { error } = await supabase.from("emergency_posts").insert({
      user_id: user!.id,
      post_type: form.post_type,
      title: form.title,
      description: form.description,
      location: form.location,
      urgency: form.urgency,
      blood_group: form.blood_group || null,
      contact_phone: form.contact_phone,
    });
    setLoading(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Emergency post created!");
      setDialogOpen(false);
      setForm({ post_type: "donor_request", title: "", description: "", location: "", urgency: "urgent", blood_group: "", contact_phone: "" });
      loadPosts();
    }
  };

  const urgencyColor = (u: string) => {
    if (u === "critical") return "bg-emergency text-emergency-foreground";
    if (u === "urgent") return "bg-warning text-warning-foreground";
    return "bg-muted text-muted-foreground";
  };

  const typeLabel = (t: string) => {
    if (t === "donor_request") return "Donor Request";
    if (t === "hospital_help") return "Hospital Help";
    return "Volunteer";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Emergency Feed</h1>
            <p className="text-muted-foreground">Active emergency requests in your area</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Post Emergency</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Emergency Post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.post_type} onValueChange={(v) => setForm(p => ({ ...p, post_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="donor_request">Donor Request</SelectItem>
                      <SelectItem value="hospital_help">Hospital Help</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Urgency</Label>
                    <Select value={form.urgency} onValueChange={(v) => setForm(p => ({ ...p, urgency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Select value={form.blood_group} onValueChange={(v) => setForm(p => ({ ...p, blood_group: v }))}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>{bloodGroups.filter(Boolean).map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value={form.contact_phone} onChange={(e) => setForm(p => ({ ...p, contact_phone: e.target.value }))} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Post Emergency
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {posts.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No active emergencies</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className={`transition-shadow hover:shadow-md ${post.urgency === "critical" ? "border-emergency/50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-4 w-4 ${post.urgency === "critical" ? "text-emergency" : "text-warning"}`} />
                        <h3 className="font-semibold text-sm">{post.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{post.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {post.location && <span>📍 {post.location}</span>}
                        {post.contact_phone && <span>📞 {post.contact_phone}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={urgencyColor(post.urgency)}>{post.urgency}</Badge>
                      <Badge variant="outline" className="text-xs">{typeLabel(post.post_type)}</Badge>
                      {post.blood_group && <Badge variant="outline" className="font-mono text-xs">{post.blood_group}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
