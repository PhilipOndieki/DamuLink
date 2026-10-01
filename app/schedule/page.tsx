import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ScheduleClient } from "./ScheduleClient";
import type { Facility, SurgicalSchedule, BloodUnit } from "@/types";

export default async function SchedulePage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: facilities } = await supabase
    .from("facilities")
    .select("*")
    .order("name");

  const currentFacility = facilities?.[0] as Facility | undefined;

  if (!currentFacility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No facility assigned.</p>
      </div>
    );
  }

  const { data: schedules } = await supabase
    .from("surgical_schedules")
    .select("*, facility:facility_id(id, name, county, lat, lng, contact_phone, trust_score)")
    .eq("facility_id", currentFacility.id)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at");

  // Check low-stock blood types across all facilities
  const { data: allUnits } = await supabase
    .from("blood_units")
    .select("blood_type, units_available, status")
    .eq("status", "available");

  const stockByType: Record<string, number> = {};
  for (const unit of allUnits ?? []) {
    const key = unit.blood_type as string;
    stockByType[key] = (stockByType[key] ?? 0) + (unit.units_available as number);
  }

  return (
    <ScheduleClient
      facility={currentFacility}
      schedules={(schedules ?? []) as SurgicalSchedule[]}
      stockByType={stockByType}
    />
  );
}
