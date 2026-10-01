"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import type { Facility, SurgicalSchedule } from "@/types";

const LOW_STOCK_THRESHOLD = 5;

interface ScheduleClientProps {
  facility: Facility;
  schedules: SurgicalSchedule[];
  stockByType: Record<string, number>;
}

export function ScheduleClient({
  facility,
  schedules,
  stockByType,
}: ScheduleClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from("surgical_schedules").delete().eq("id", id);
    setDeletingId(null);
    router.refresh();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
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
            <span className="text-sm text-gray-500">{facility.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
              Dashboard
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surgical Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upcoming procedures and blood requirements for {facility.name}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Add schedule form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Add Procedure
            </h2>
            <ScheduleForm
              facilityId={facility.id}
              onSuccess={() => router.refresh()}
            />
          </div>

          {/* Schedule table */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Upcoming Procedures
            </h2>
            <Table
              headers={[
                "Procedure",
                "Scheduled",
                "Blood Type",
                "Units Needed",
                "Stock Status",
                "",
              ]}
              isEmpty={schedules.length === 0}
              emptyMessage="No upcoming procedures"
            >
              {schedules.map((schedule) => {
                const stock = stockByType[schedule.blood_type_needed] ?? 0;
                const isLow = stock < schedule.units_needed;
                const isCriticallyLow = stock < LOW_STOCK_THRESHOLD;

                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.procedure_name}
                    </TableCell>
                    <TableCell>
                      {new Date(schedule.scheduled_at).toLocaleString("en-KE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-brand-red">
                        {schedule.blood_type_needed}
                      </span>
                    </TableCell>
                    <TableCell>{schedule.units_needed} units</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant={isCriticallyLow ? "danger" : "warning"}>
                          {isCriticallyLow ? "Critical" : "Low"} ({stock} available)
                        </Badge>
                      ) : (
                        <Badge variant="success">{stock} in stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        disabled={deletingId === schedule.id}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deletingId === schedule.id ? "..." : "Remove"}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
