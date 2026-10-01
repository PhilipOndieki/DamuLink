"use client";

import { useEffect, useState } from "react";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import type { BloodUnit } from "@/types";

interface ExpiryTableProps {
  units: BloodUnit[];
}

/** Formats milliseconds remaining into a human-readable countdown string */
function formatCountdown(expiryTimestamp: string): {
  text: string;
  isUrgent: boolean;
  isCritical: boolean;
} {
  const now = Date.now();
  const expiry = new Date(expiryTimestamp).getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return { text: "EXPIRED", isUrgent: true, isCritical: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const isCritical = hours < 12;
  const isUrgent = hours < 24;

  if (hours === 0) {
    return { text: `${minutes}m`, isUrgent: true, isCritical: true };
  }
  if (hours < 24) {
    return { text: `${hours}h ${minutes}m`, isUrgent, isCritical };
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return {
    text: `${days}d ${remainingHours}h`,
    isUrgent: false,
    isCritical: false,
  };
}

/** Live expiry countdown table with real-time timer updates */
export function ExpiryTable({ units }: ExpiryTableProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const sorted = [...units].sort(
    (a, b) =>
      new Date(a.expiry_timestamp).getTime() -
      new Date(b.expiry_timestamp).getTime()
  );

  return (
    <Table
      headers={[
        "Blood Type",
        "Units Available",
        "Expiry Date",
        "Time Remaining",
        "Status",
      ]}
      isEmpty={sorted.length === 0}
      emptyMessage="No blood units in stock"
    >
      {sorted.map((unit) => {
        const countdown = formatCountdown(unit.expiry_timestamp);
        return (
          <TableRow
            key={unit.id}
            className={countdown.isCritical ? "pulse-red" : ""}
          >
            <TableCell>
              <span className="font-bold text-brand-red">
                {unit.blood_type}
              </span>
            </TableCell>
            <TableCell>{unit.units_available} units</TableCell>
            <TableCell className="text-gray-500">
              {new Date(unit.expiry_timestamp).toLocaleString("en-KE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </TableCell>
            <TableCell>
              <span
                className={[
                  "font-mono font-semibold",
                  countdown.isCritical
                    ? "text-red-700"
                    : countdown.isUrgent
                    ? "text-orange-600"
                    : "text-green-600",
                ].join(" ")}
              >
                {countdown.text}
              </span>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  unit.status === "available"
                    ? "success"
                    : unit.status === "reserved"
                    ? "pending"
                    : unit.status === "dispatched"
                    ? "info"
                    : "danger"
                }
              >
                {unit.status}
              </Badge>
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}
