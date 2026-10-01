import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AdminClient } from "./AdminClient";
import type { AuditLog, Donor, Facility } from "@/types";

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: auditLogs },
    { data: facilities },
    { data: donors },
  ] = await Promise.all([
    supabase
      .from("audit_log")
      .select("*, facility:facility_id(id, name, county, lat, lng, contact_phone, trust_score)")
      .order("timestamp", { ascending: false })
      .limit(100),
    supabase.from("facilities").select("*").order("name"),
    supabase.from("donors").select("*").order("blood_type"),
  ]);

  return (
    <AdminClient
      auditLogs={(auditLogs ?? []) as AuditLog[]}
      facilities={(facilities ?? []) as Facility[]}
      donors={(donors ?? []) as Donor[]}
    />
  );
}
