import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Heart, Droplet, User, Calendar, Award } from "lucide-react";
import { toast } from "sonner";

export default function RegisteredDonors() {
    const [donors, setDonors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchBloodGroup, setSearchBloodGroup] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [sortBy, setSortBy] = useState("availability");

    useEffect(() => {
        fetchDonors();
    }, []);

    const fetchDonors = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("donors")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setDonors(data || []);
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch donors");
        } finally {
            setLoading(false);
        }
    };

    const filteredDonors = donors
        .filter((donor) => {
            const matchBloodGroup = searchBloodGroup ? donor.blood_group === searchBloodGroup || searchBloodGroup === "All" : true;
            const matchLocation = filterLocation ? donor.city.toLowerCase().includes(filterLocation.toLowerCase()) : true;
            return matchBloodGroup && matchLocation;
        })
        .sort((a, b) => {
            if (sortBy === "availability") {
                if (a.availability === "available" && b.availability !== "available") return -1;
                if (a.availability !== "available" && b.availability === "available") return 1;
            }
            if (sortBy === "points") {
                return b.points - a.points;
            }
            if (sortBy === "recent") {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return 0;
        });

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold md:text-3xl flex items-center gap-2">
                        <User className="h-6 w-6 text-primary" />
                        Registered Donors
                    </h1>
                    <p className="text-muted-foreground">View and search through all registered blood donors.</p>
                </div>

                {/* Filters and Search */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by city/location..."
                            className="pl-9"
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                        />
                    </div>

                    <Select value={searchBloodGroup} onValueChange={setSearchBloodGroup}>
                        <SelectTrigger>
                            <SelectValue placeholder="Search by Blood Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Blood Groups</SelectItem>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="availability">Sort by Availability</SelectItem>
                            <SelectItem value="points">Sort by Points</SelectItem>
                            <SelectItem value="recent">Sort by Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Donor Grid */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="h-24 bg-muted" />
                                <CardContent className="h-32" />
                            </Card>
                        ))}
                    </div>
                ) : filteredDonors.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground flex flex-col items-center">
                        <User className="h-12 w-12 text-muted mb-4" />
                        <p>No donors found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredDonors.map((donor) => (
                            <Card key={donor.id} className="overflow-hidden border-t-4 border-t-primary transition-shadow hover:shadow-md">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-bold">{donor.full_name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {donor.city}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="text-lg font-mono font-bold bg-primary/10 text-primary border-primary/20 p-2">
                                            <Droplet className="h-4 w-4 mr-1 text-primary" />
                                            {donor.blood_group}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 grid gap-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">Phone:</span> {donor.phone}
                                        </div>
                                        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap" title={donor.email}>
                                            <span className="font-semibold text-foreground">Email:</span> {donor.email}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-y border-border/50">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-muted-foreground">Donations</span>
                                            <span className="font-bold">{donor.total_donations}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-muted-foreground">Lives Saved</span>
                                            <span className="flex items-center font-bold text-destructive">
                                                <Heart className="h-3 w-3 mr-1" />
                                                {donor.total_donations}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-muted-foreground">Points</span>
                                            <span className="flex items-center font-bold text-amber-500">
                                                <Award className="h-3 w-3 mr-1" />
                                                {donor.points}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-1">
                                        <div className="flex items-center gap-1 text-xs">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">Last Donation:</span>
                                            {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'Never'}
                                        </div>
                                        <Badge className={
                                            donor.availability === 'available' ? 'bg-success hover:bg-success/90' : 'bg-muted text-muted-foreground hover:bg-muted/90'
                                        }>
                                            {donor.availability === 'available' ? 'Available' : 'Unavailable'}
                                        </Badge>
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
