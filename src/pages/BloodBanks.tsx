import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Phone, Mail, Search, MapPin, Navigation } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const stockKey: Record<string, keyof Tables<"blood_banks">> = {
  "A+": "a_pos", "A-": "a_neg", "B+": "b_pos", "B-": "b_neg",
  "AB+": "ab_pos", "AB-": "ab_neg", "O+": "o_pos", "O-": "o_neg",
};

// Mock real-world data specifically requested for Vijayawada
const predefinedVijayawadaBanks = [
  {
    id: "mock-1",
    name: "Smile Blood Bank",
    location: "Governor Peta, Vijayawada, Andhra Pradesh",
    latitude: 16.5062,
    longitude: 80.6480,
    contact_phone: "+91 9876543210",
    email: "contact@smilebloodbank.com",
    o_pos: 45, o_neg: 12, a_pos: 30, a_neg: 5, b_pos: 25, b_neg: 8, ab_pos: 15, ab_neg: 3
  },
  {
    id: "mock-2",
    name: "Suraksha Voluntary Blood Bank",
    location: "Suryaraopeta, Vijayawada, Andhra Pradesh",
    latitude: 16.5085,
    longitude: 80.6355,
    contact_phone: "+91 9123456780",
    email: "help@surakshabb.org",
    o_pos: 20, o_neg: 4, a_pos: 15, a_neg: 2, b_pos: 40, b_neg: 6, ab_pos: 10, ab_neg: 1
  },
  {
    id: "mock-3",
    name: "New City Blood Bank",
    location: "Labbipet, Vijayawada, Andhra Pradesh",
    latitude: 16.5033,
    longitude: 80.6465,
    contact_phone: "+91 8888888888",
    email: "info@newcitybb.com",
    o_pos: 60, o_neg: 15, a_pos: 40, a_neg: 8, b_pos: 35, b_neg: 10, ab_pos: 20, ab_neg: 5
  },
  {
    id: "mock-4",
    name: "Government Blood Bank Vijayawada",
    location: "Government General Hospital, Vijayawada",
    latitude: 16.5144,
    longitude: 80.6277,
    contact_phone: "+91 866 2434343",
    email: "gghvja.bb@gov.in",
    o_pos: 100, o_neg: 25, a_pos: 80, a_neg: 15, b_pos: 70, b_neg: 20, ab_pos: 40, ab_neg: 10
  }
];

export default function BloodBanks() {
  const [dbBanks, setDbBanks] = useState<any[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");
  const [isSearching, setIsSearching] = useState(false);
  const [displayedBanks, setDisplayedBanks] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("blood_banks").select("*").order("name").then(({ data }) => {
      setDbBanks(data ?? []);
      setDisplayedBanks(data ?? []);
    });
  }, []);

  const handleSearch = () => {
    setIsSearching(true);

    // Simulate API delay
    setTimeout(() => {
      let results: any[] = [...dbBanks];

      const searchTerms = searchLocation.toLowerCase();

      // If searching for Vijayawada, inject our predefined real-world data
      if (searchTerms.includes("vijayawada")) {
        // Only add if they aren't already in the DB results (simple check by name)
        const existingNames = new Set(results.map(b => b.name));
        const newMocks = predefinedVijayawadaBanks.filter(mb => !existingNames.has(mb.name));
        results = [...newMocks, ...results];
      }

      // Filter by search terms
      if (searchTerms.trim() !== "") {
        results = results.filter((b) =>
          b.name.toLowerCase().includes(searchTerms) ||
          b.location.toLowerCase().includes(searchTerms)
        );
      }

      // Filter by blood group
      if (filterGroup !== "All") {
        const key = stockKey[filterGroup];
        results = results.filter((b) => (b[key] as number) > 0);
      }

      // Calculate mock distance (in a real app, uses Haversine formula based on user's geolocation)
      results = results.map((b, index) => ({
        ...b,
        distance: searchTerms.trim() !== "" ? (1.2 + (index * 1.5)).toFixed(1) + " km" : "Unknown"
      }));

      setDisplayedBanks(results);
      setIsSearching(false);
    }, 600);
  };

  // Run search when filters change
  useEffect(() => {
    handleSearch();
  }, [filterGroup]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Blood Bank Search
          </h1>
          <p className="text-muted-foreground">Find real blood banks near your location and check availability</p>
        </div>

        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium">Search Location or Name</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. Vijayawada, Andhra Pradesh..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-medium">Blood Group Needed</label>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{bloodGroups.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Button onClick={handleSearch} className="w-full md:w-auto" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {isSearching ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted" />
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : displayedBanks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Building2 className="h-12 w-12 text-muted mb-4 opacity-50" />
              <p className="text-lg font-medium">No blood banks found</p>
              <p className="text-sm">Try searching for a different location like "Vijayawada"</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {displayedBanks.map((bank) => (
              <Card key={bank.id} className="transition-shadow hover:shadow-md border-l-4 border-l-primary flex flex-col">
                <CardHeader className="pb-3 border-b bg-muted/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {bank.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-start gap-1 mt-2">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                        <span>{bank.location}</span>
                      </p>
                    </div>
                    {bank.distance && bank.distance !== "Unknown" && (
                      <Badge variant="secondary" className="flex items-center gap-1 shrink-0 bg-primary/10 text-primary">
                        <Navigation className="h-3 w-3" />
                        {bank.distance}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 flex-grow">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Available Blood Stock</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stockKey).map(([group, key]) => {
                        const count = bank[key] as number;
                        if (count > 0) {
                          return (
                            <Badge key={group} variant="outline" className="text-xs font-mono bg-primary/5 border-primary/20 text-foreground">
                              {group}: <span className="font-bold ml-1 text-primary">{count}</span>
                            </Badge>
                          );
                        }
                        return null;
                      })}
                      {Object.entries(stockKey).every(([_, key]) => !(bank[key] as number > 0)) && (
                        <span className="text-sm text-muted-foreground italic">No stock currently available</span>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/5 py-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {bank.contact_phone ? (
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {bank.contact_phone}
                    </div>
                  ) : <div></div>}
                  {bank.email && (
                    <div className="flex items-center gap-1.5 truncate" title={bank.email}>
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{bank.email}</span>
                    </div>
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
