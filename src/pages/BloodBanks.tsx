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

// DB stock column mapping
const stockKey: Record<string, keyof Tables<"blood_banks">> = {
  "A+": "a_pos", "A-": "a_neg", "B+": "b_pos", "B-": "b_neg",
  "AB+": "ab_pos", "AB-": "ab_neg", "O+": "o_pos", "O-": "o_neg",
};

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

  const handleSearch = async () => {
    const searchTerms = searchLocation.trim();
    
    setIsSearching(true);

    try {
      let query = supabase.from("blood_banks").select("*");

      if (searchTerms) {
        // Simple search string implementation, case-insensitive via ILIKE
        query = query.ilike('location', `%${searchTerms}%`);
      }

      if (filterGroup !== "All") {
        const key = stockKey[filterGroup];
        // Only return where that blood group has more than 0 units
        query = query.gt(key as string, 0);
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      
      setDisplayedBanks(data || []);
    } catch (error) {
      console.error("Error fetching blood banks:", error);
      // Make sure UI still drops the mock API loading state
      setDisplayedBanks([]);
    } finally {
      setIsSearching(false);
    }
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
              <p className="text-lg font-medium">No blood banks found in this city.</p>
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
                <CardFooter className="bg-muted/5 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-col gap-1.5">
                    {bank.contact_phone ? (
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        {bank.contact_phone}
                      </div>
                    ) : (
                      bank.email && (
                        <div className="flex items-center gap-1.5 truncate" title={bank.email}>
                          <Mail className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate max-w-[150px]">{bank.email}</span>
                        </div>
                      )
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm" className="h-8 text-xs ml-auto" asChild>
                    <a 
                      href={bank.latitude && bank.longitude 
                        ? `https://www.google.com/maps/dir/?api=1&destination=${bank.latitude},${bank.longitude}` 
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bank.name + ' ' + bank.location)}`
                      } 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Directions
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
