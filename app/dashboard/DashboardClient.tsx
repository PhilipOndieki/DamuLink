"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ExpiryTable } from "@/components/dashboard/ExpiryTable";
import { MatchPanel } from "@/components/dashboard/MatchPanel";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BloodUnitForm } from "@/components/forms/BloodUnitForm";
import type { BloodUnit, DashboardStats, Facility, MatchRequest } from "@/types";

// Dynamic import for Leaflet map to avoid SSR crash
const FacilityMap = dynamic(
  () =>
    import("@/components/dashboard/FacilityMap").then((m) => m.FacilityMap),
  { ssr: false, loading: () => <div className="h-72 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface DashboardClientProps {
  facility: Facility;
  allFacilities: Facility[];
  bloodUnits: BloodUnit[];
  matchRequests: MatchRequest[];
  stats: DashboardStats;
}

export function DashboardClient({
  facility,
  allFacilities,
  bloodUnits: initialUnits,
  matchRequests: initialMatches,
  stats: initialStats,
}: DashboardClientProps) {
  const router = useRouter();
  const [bloodUnits, setBloodUnits] = useState(initialUnits);
  const [matchRequests, setMatchRequests] = useState(initialMatches);
  const [stats, setStats] = useState(initialStats);
  const [addUnitOpen, setAddUnitOpen] = useState(false);

  // Real-time subscription to blood_units changes
  useEffect(() => {
    const channel = supabase
      .channel("blood_units_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blood_units",
          filter: `facility_id=eq.${facility.id}`,
        },
        () => {
          // Refresh page data on any change
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facility.id, router]);

  // Real-time subscription to match_requests
  useEffect(() => {
    const channel = supabase
      .channel("match_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_requests",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  function handleMatchStatusChange(
    matchId: string,
    status: "confirmed" | "declined"
  ) {
    setMatchRequests((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status } : m))
    );
    if (status === "confirmed") {
      setStats((s) => ({ ...s, active_matches: s.active_matches + 1 }));
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-red rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">
                DamuLink
              </span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-700">
              {facility.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/schedule"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block"
            >
              Schedule
            </Link>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block"
            >
              Admin
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Units in Stock"
            value={stats.total_units}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            }
          />
          <StatsCard
            title="Expiring in 24hrs"
            value={stats.expiring_24h}
            highlight={stats.expiring_24h > 0}
            subtitle={stats.expiring_24h > 0 ? "Needs immediate action" : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatsCard
            title="Active Matches"
            value={stats.active_matches}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            }
          />
          <StatsCard
            title="Trust Score"
            value={`${stats.trust_score}/10`}
            subtitle="Based on match history"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
          />
        </div>

        {/* Blood units table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Blood Unit Inventory</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Units under 12 hours pulse red
              </p>
            </div>
            <Button size="sm" onClick={() => setAddUnitOpen(true)}>
              + Add Unit
            </Button>
          </div>
          <ExpiryTable units={bloodUnits} />
        </div>

        {/* Match panel + Map side by side on desktop */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-5">Match Requests</h2>
            <MatchPanel
              matches={matchRequests}
              facilityId={facility.id}
              onStatusChange={handleMatchStatusChange}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-5">Facility Map</h2>
            <FacilityMap
              facility={facility}
              allFacilities={allFacilities}
              activeMatches={matchRequests}
            />
          </div>
        </div>
      </main>

      {/* Add Blood Unit modal */}
      <Modal
        open={addUnitOpen}
        onClose={() => setAddUnitOpen(false)}
        title="Add Blood Unit"
      >
        <BloodUnitForm
          facilityId={facility.id}
          onSuccess={() => {
            setAddUnitOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
