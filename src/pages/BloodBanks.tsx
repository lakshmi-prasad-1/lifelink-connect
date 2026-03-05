import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Phone, Mail, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const stockKey: Record<string, keyof Tables<"blood_banks">> = {
  "A+": "a_pos", "A-": "a_neg", "B+": "b_pos", "B-": "b_neg",
  "AB+": "ab_pos", "AB-": "ab_neg", "O+": "o_pos", "O-": "o_neg",
};

export default function BloodBanks() {
  const [banks, setBanks] = useState<Tables<"blood_banks">[]>([]);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");

  useEffect(() => {
    supabase.from("blood_banks").select("*").order("name").then(({ data }) => setBanks(data ?? []));
  }, []);

  const filtered = banks.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.location.toLowerCase().includes(search.toLowerCase());
    if (filterGroup === "All") return matchSearch;
    const key = stockKey[filterGroup];
    return matchSearch && (b[key] as number) > 0;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Blood Bank Directory</h1>
          <p className="text-muted-foreground">Find blood banks and check availability</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{bloodGroups.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No blood banks found</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bank) => (
              <Card key={bank.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-primary" />
                    {bank.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{bank.location}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(stockKey).map(([group, key]) => {
                      const count = bank[key] as number;
                      return (
                        <Badge key={group} variant={count > 0 ? "default" : "outline"} className={`text-xs ${count > 0 ? "bg-primary" : ""}`}>
                          {group}: {count}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {bank.contact_phone && (
                      <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{bank.contact_phone}</p>
                    )}
                    {bank.email && (
                      <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{bank.email}</p>
                    )}
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
