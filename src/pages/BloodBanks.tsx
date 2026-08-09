import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Phone, Mail, Search, MapPin, Navigation, AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PenSquare, Loader2 } from "lucide-react";

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// DB stock column mapping
const stockKey: Record<string, keyof Tables<"blood_banks">> = {
  "A+": "a_pos", "A-": "a_neg", "B+": "b_pos", "B-": "b_neg",
  "AB+": "ab_pos", "AB-": "ab_neg", "O+": "o_pos", "O-": "o_neg",
};

export default function BloodBanks() {
  const [allBanks, setAllBanks] = useState<Tables<"blood_banks">[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");
  const [isSearching, setIsSearching] = useState(false);
  const [displayedBanks, setDisplayedBanks] = useState<Tables<"blood_banks">[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const isAdmin = useIsAdmin();
  const [editingBank, setEditingBank] = useState<Tables<"blood_banks"> | null>(null);
  const [stockForm, setStockForm] = useState<Record<string, string>>({});
  const [savingStock, setSavingStock] = useState(false);

  // Load all blood banks on mount
  useEffect(() => {
    const loadBanks = async () => {
      const { data, error } = await supabase
        .from("blood_banks")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error loading blood banks:", error);
        setSearchError("Failed to load blood banks");
      } else {
        setAllBanks(data ?? []);
        setDisplayedBanks(data ?? []);
      }
    };

    loadBanks();
  }, []);

  const handleSearch = async () => {
    const searchTerms = searchLocation.trim();
    setSearchError(null);

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

      if (!data || data.length === 0) {
        setSearchError(`No blood banks found${searchTerms ? ` near "${searchTerms}"` : ""}. Try other cities.`);
      }

      setDisplayedBanks(data || []);
    } catch (error) {
      console.error("Error fetching blood banks:", error);
      setSearchError("Error searching blood banks. Please try again.");
      setDisplayedBanks([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Run search when filters change
  useEffect(() => {
    if (searchLocation.trim()) {
      handleSearch();
    }
  }, [filterGroup]);

  const openEditDialog = (bank: Tables<"blood_banks">) => {
    setEditingBank(bank);
    setStockForm(
      Object.fromEntries(Object.values(stockKey).map((key) => [key, String(bank[key] ?? 0)]))
    );
  };

  const handleSaveStock = async () => {
    if (!editingBank) return;
    setSavingStock(true);
    const update = Object.fromEntries(
      Object.entries(stockForm).map(([key, value]) => [key, Math.max(0, parseInt(value) || 0)])
    );
    const { error } = await supabase.from("blood_banks").update(update).eq("id", editingBank.id);
    setSavingStock(false);
    if (error) {
      setSearchError(error.message);
      return;
    }
    const refreshed = { ...editingBank, ...update } as Tables<"blood_banks">;
    setAllBanks((prev) => prev.map((b) => (b.id === refreshed.id ? refreshed : b)));
    setDisplayedBanks((prev) => prev.map((b) => (b.id === refreshed.id ? { ...b, ...refreshed } : b)));
    setEditingBank(null);
  };

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
                placeholder="e.g. Vijayawada, Andhra Pradesh, Hyderabad, Bangalore..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Try: Vijayawada, Hyderabad, Visakhapatnam, Bangalore, Guntur, Bhimavaram...
            </p>
          </div>

          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-medium">Blood Group Needed</label>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{bloodGroups.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Button onClick={handleSearch} className="w-full md:w-auto" disabled={isSearching}>
            {isSearching ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {searchError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">{searchError}</p>
              <p className="text-xs text-yellow-700 mt-1">
                Showing all available blood banks. Try searching by city name or refine your search.
              </p>
            </div>
          </div>
        )}

        {isSearching ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted rounded-t-lg" />
                <CardContent className="h-40 bg-muted/50" />
                <CardFooter className="h-16 bg-muted/30 rounded-b-lg" />
              </Card>
            ))}
          </div>
        ) : displayedBanks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Building2 className="h-12 w-12 text-muted mb-4 opacity-50" />
              <p className="text-lg font-medium">No blood banks found</p>
              <p className="text-sm mt-2">
                {searchLocation
                  ? `Try searching with different keywords or nearby cities`
                  : 'Enter a city name to find blood banks'
                }
              </p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground/70">
                <p>💡 <strong>Suggestions:</strong></p>
                <p>• Vijayawada, Hyderabad, Visakhapatnam</p>
                <p>• Bangalore, Guntur, Nellore</p>
                <p>• Bhimavaram, Rajamundry, Ongole</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{displayedBanks.length}</span>
              <span>blood {displayedBanks.length === 1 ? "bank" : "banks"} found</span>
              {searchLocation && (
                <>
                  <span>near</span>
                  <span className="font-medium text-foreground">{searchLocation}</span>
                </>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedBanks.map((bank) => (
              <Card key={bank.id} className="transition-shadow hover:shadow-lg border-l-4 border-l-primary flex flex-col overflow-hidden">
                <CardHeader className="pb-3 border-b bg-gradient-to-r from-muted/10 to-transparent">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base font-bold line-clamp-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        {bank.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground flex items-start gap-1 mt-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 mt-0.5" />
                        <span className="line-clamp-2">{bank.location}</span>
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-primary shrink-0"
                        onClick={() => openEditDialog(bank)}
                      >
                        <PenSquare className="h-3.5 w-3.5 mr-1" />
                        Edit Stock
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4 flex-grow">
                  {/* Blood Stock Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-primary/70 tracking-wider">
                      Available Blood Stock
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(stockKey).map(([group, key]) => {
                        const count = bank[key] as number;
                        return (
                          <Badge
                            key={group}
                            variant={count > 0 ? "default" : "outline"}
                            className={`text-xs font-mono ${
                              count > 0
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "bg-muted text-muted-foreground border-muted-foreground/20"
                            }`}
                          >
                            {group} <span className="font-bold ml-1.5">{count > 0 ? count : "–"}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/5 py-3 border-t flex flex-col gap-3">
                  <div className="w-full space-y-1.5">
                    {bank.contact_phone ? (
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                        <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <a
                          href={`tel:${bank.contact_phone}`}
                          className="hover:text-primary transition-colors"
                        >
                          {bank.contact_phone}
                        </a>
                      </div>
                    ) : null}
                    {bank.email ? (
                      <div className="flex items-center gap-2 text-sm text-foreground/80 truncate">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <a
                          href={`mailto:${bank.email}`}
                          className="hover:text-primary transition-colors truncate text-xs"
                          title={bank.email}
                        >
                          {bank.email}
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-medium hover:bg-primary hover:text-primary-foreground"
                    asChild
                  >
                    <a
                      href={
                        bank.latitude && bank.longitude
                          ? `https://www.google.com/maps/dir/?api=1&destination=${bank.latitude},${bank.longitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              bank.name + " " + bank.location
                            )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-3.5 w-3.5 mr-1.5" />
                      Get Directions on Maps
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!editingBank} onOpenChange={(open) => !open && setEditingBank(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock — {editingBank?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {Object.entries(stockKey).map(([group, key]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`stock-${key}`}>{group} units</Label>
                <Input
                  id={`stock-${key}`}
                  type="number"
                  min="0"
                  value={stockForm[key] ?? "0"}
                  onChange={(e) => setStockForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBank(null)}>Cancel</Button>
            <Button onClick={handleSaveStock} disabled={savingStock}>
              {savingStock ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
