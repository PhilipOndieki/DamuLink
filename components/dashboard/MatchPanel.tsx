"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { MatchRequest } from "@/types";

interface MatchPanelProps {
  matches: MatchRequest[];
  facilityId: string;
  onStatusChange?: (matchId: string, status: "confirmed" | "declined") => void;
}

/** Displays incoming match requests with Accept/Decline actions */
export function MatchPanel({ matches, facilityId, onStatusChange }: MatchPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const incoming = matches.filter(
    (m) =>
      m.receiver_facility_id === facilityId && m.status === "pending"
  );

  const outgoing = matches.filter(
    (m) => m.donor_facility_id === facilityId
  );

  async function handleAction(
    matchId: string,
    action: "confirmed" | "declined"
  ) {
    setLoadingId(matchId);
    try {
      const res = await fetch(`/api/match/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        onStatusChange?.(matchId, action);
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Incoming requests */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Incoming Requests
          {incoming.length > 0 && (
            <span className="ml-2 bg-brand-red text-white text-xs rounded-full px-2 py-0.5">
              {incoming.length}
            </span>
          )}
        </h3>

        {incoming.length === 0 ? (
          <p className="text-sm text-gray-400">No pending incoming requests</p>
        ) : (
          <div className="space-y-3">
            {incoming.map((match) => (
              <Card key={match.id} padding="sm" className="border-orange-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {match.donor_facility?.name ?? "Unknown facility"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Needs{" "}
                      <span className="font-bold text-brand-red">
                        {match.units_requested} units of {match.blood_type}
                      </span>
                    </p>
                    {match.confidence_score != null && (
                      <p className="text-xs text-gray-400 mt-1">
                        Match confidence:{" "}
                        <span className="font-medium">
                          {(match.confidence_score * 100).toFixed(0)}%
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      loading={loadingId === match.id}
                      onClick={() => handleAction(match.id, "confirmed")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loadingId === match.id}
                      onClick={() => handleAction(match.id, "declined")}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing dispatches */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Outgoing Dispatches
        </h3>

        {outgoing.length === 0 ? (
          <p className="text-sm text-gray-400">No outgoing dispatches</p>
        ) : (
          <div className="space-y-2">
            {outgoing.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {match.receiver_facility?.name ?? "Unknown facility"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {match.units_requested} units · {match.blood_type}
                  </p>
                </div>
                <Badge
                  variant={
                    match.status === "confirmed"
                      ? "success"
                      : match.status === "declined"
                      ? "danger"
                      : match.status === "delivered"
                      ? "info"
                      : "pending"
                  }
                >
                  {match.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
