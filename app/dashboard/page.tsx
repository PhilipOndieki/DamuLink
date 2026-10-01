import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DashboardClient } from "./DashboardClient";
import type { BloodUnit, Facility, MatchRequest } from "@/types";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all facilities
  const { data: facilities } = await supabase
    .from("facilities")
    .select("*")
    .order("name");

  // For demo purposes use first facility. In production this would tie to user metadata.
  const currentFacility = facilities?.[0] as Facility | undefined;

  if (!currentFacility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No facility assigned to this account.</p>
      </div>
    );
  }

  // Fetch blood units for this facility
  const { data: bloodUnits } = await supabase
    .from("blood_units")
    .select("*")
    .eq("facility_id", currentFacility.id)
    .neq("status", "expired")
    .order("expiry_timestamp");

  // Fetch match requests involving this facility
  const { data: matchRequests } = await supabase
    .from("match_requests")
    .select(`
      *,
      donor_facility:donor_facility_id(id, name, county, lat, lng, contact_phone, trust_score),
      receiver_facility:receiver_facility_id(id, name, county, lat, lng, contact_phone, trust_score)
    `)
    .or(
      `donor_facility_id.eq.${currentFacility.id},receiver_facility_id.eq.${currentFacility.id}`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const now = Date.now();
  const expiring24h = (bloodUnits ?? []).filter((u: BloodUnit) => {
    const expiryMs = new Date(u.expiry_timestamp).getTime();
    return expiryMs - now < 24 * 60 * 60 * 1000 && expiryMs > now;
  }).length;

  const activeMatches = (matchRequests ?? []).filter(
    (m: MatchRequest) => m.status === "pending" || m.status === "confirmed"
  ).length;

  return (
    <DashboardClient
      facility={currentFacility}
      allFacilities={(facilities ?? []) as Facility[]}
      bloodUnits={(bloodUnits ?? []) as BloodUnit[]}
      matchRequests={(matchRequests ?? []) as MatchRequest[]}
      stats={{
        total_units: (bloodUnits ?? []).reduce(
          (sum: number, u: BloodUnit) => sum + u.units_available,
          0
        ),
        expiring_24h: expiring24h,
        active_matches: activeMatches,
        trust_score: currentFacility.trust_score,
      }}
    />
  );
}
