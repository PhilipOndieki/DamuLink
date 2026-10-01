"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AuditLog, AuditEventType, Donor, Facility } from "@/types";

const AdminMap = dynamic(
  () => import("./AdminMap").then((m) => m.AdminMap),
  { ssr: false, loading: () => <div className="h-80 bg-gray-100 rounded-lg animate-pulse" /> }
);

const EVENT_TYPE_VARIANTS: Record<AuditEventType, "success" | "danger" | "info" | "pending" | "warning" | "default"> = {
  unit_added: "success",
  unit_expired: "danger",
  match_created: "info",
  match_confirmed: "success",
  match_declined: "danger",
  match_delivered: "success",
  sms_sent: "info",
  sms_received: "info",
  facility_registered: "success",
  trust_score_updated: "warning",
};

interface AdminClientProps {
  auditLogs: AuditLog[];
  facilities: Facility[];
  donors: Donor[];
}

export function AdminClient({ auditLogs, facilities, donors }: AdminClientProps) {
  const router = useRouter();
  const [filterFacility, setFilterFacility] = useState("");
  const [filterEventType, setFilterEventType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsBloodType, setSmsBloodType] = useState("O+");
  const [smsCounty, setSmsCounty] = useState("Nairobi");
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [editingTrust, setEditingTrust] = useState<string | null>(null);
  const [trustValues, setTrustValues] = useState<Record<string, number>>(
    Object.fromEntries(facilities.map((f) => [f.id, f.trust_score]))
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const filteredLogs = auditLogs.filter((log) => {
    if (filterFacility && log.facility_id !== filterFacility) return false;
    if (filterEventType && log.event_type !== filterEventType) return false;
    if (filterDateFrom && log.timestamp < filterDateFrom) return false;
    if (filterDateTo && log.timestamp > filterDateTo + "T23:59:59") return false;
    return true;
  });

  const uniqueEventTypes = Array.from(
    new Set(auditLogs.map((l) => l.event_type))
  ).sort();

  const counties = Array.from(new Set(facilities.map((f) => f.county))).sort();

  async function handleBulkSms() {
    setSmsSending(true);
    setSmsResult(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blood_type: smsBloodType, county: smsCounty }),
      });
      const json = (await res.json()) as { success: boolean; data: { sent: number } | null; error: string | null };
      if (json.success) {
        setSmsResult(`SMS sent to ${json.data?.sent ?? 0} donors`);
      } else {
        setSmsResult(`Error: ${json.error}`);
      }
    } catch {
      setSmsResult("Network error");
    } finally {
      setSmsSending(false);
    }
  }

  async function saveTrustScore(facilityId: string) {
    const score = trustValues[facilityId];
    await supabase
      .from("facilities")
      .update({ trust_score: score })
      .eq("id", facilityId);

    await supabase.from("audit_log").insert({
      event_type: "trust_score_updated",
      facility_id: facilityId,
      notes: `Trust score updated to ${score}`,
    });

    setEditingTrust(null);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-red rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">DamuLink</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-700">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">Dashboard</Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>

        {/* County heatmap */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">
            Kenya County Stock Heatmap
          </h2>
          <AdminMap facilities={facilities} />
        </Card>

        {/* Donor surge trigger */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">
            Donor Surge SMS
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Send bulk SMS to all registered donors of a specific blood type in a county.
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Blood Type</label>
              <select
                value={smsBloodType}
                onChange={(e) => setSmsBloodType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">County</label>
              <select
                value={smsCounty}
                onChange={(e) => setSmsCounty(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                {counties.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              loading={smsSending}
              onClick={handleBulkSms}
            >
              Send Donor Surge SMS
            </Button>
          </div>
          {smsResult && (
            <p className={[
              "text-sm mt-3 font-medium",
              smsResult.startsWith("Error") ? "text-red-600" : "text-green-600"
            ].join(" ")}>
              {smsResult}
            </p>
          )}
        </Card>

        {/* Trust score manager */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">
            Facility Trust Scores
          </h2>
          <Table headers={["Facility", "County", "Trust Score", "Actions"]}>
            {facilities.map((facility) => (
              <TableRow key={facility.id}>
                <TableCell className="font-medium">{facility.name}</TableCell>
                <TableCell>{facility.county}</TableCell>
                <TableCell>
                  {editingTrust === facility.id ? (
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={trustValues[facility.id]}
                      onChange={(e) =>
                        setTrustValues((v) => ({
                          ...v,
                          [facility.id]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="font-mono font-semibold">
                      {facility.trust_score}/10
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingTrust === facility.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveTrustScore(facility.id)}
                        className="text-xs text-green-600 font-medium hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTrust(null)}
                        className="text-xs text-gray-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingTrust(facility.id)}
                      className="text-xs text-brand-red hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </Card>

        {/* Audit log */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="font-semibold text-gray-900">Audit Log</h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterFacility}
                onChange={(e) => setFilterFacility(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="">All Facilities</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="">All Events</option>
                {uniqueEventTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="From"
              />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="To"
              />
            </div>
          </div>

          <Table
            headers={["Event", "Facility", "Timestamp", "Notes"]}
            isEmpty={filteredLogs.length === 0}
            emptyMessage="No audit entries match the selected filters"
          >
            {filteredLogs.slice(0, 50).map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge
                    variant={EVENT_TYPE_VARIANTS[log.event_type as AuditEventType] ?? "default"}
                  >
                    {log.event_type.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.facility?.name ?? (
                    <span className="text-gray-300">—</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-500 text-xs">
                  {new Date(log.timestamp).toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell className="text-gray-500 max-w-xs truncate">
                  {log.notes ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </Table>

          {filteredLogs.length > 50 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Showing 50 of {filteredLogs.length} entries
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}
