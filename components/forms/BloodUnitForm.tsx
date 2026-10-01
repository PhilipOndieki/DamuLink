"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { BloodType } from "@/types";

const BLOOD_TYPES: BloodType[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
];

interface BloodUnitFormProps {
  facilityId: string;
  onSuccess?: () => void;
}

/** Form for adding a new blood unit to the facility inventory */
export function BloodUnitForm({ facilityId, onSuccess }: BloodUnitFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    blood_type: "O+" as BloodType,
    units_available: 1,
    expiry_timestamp: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/blood-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, facility_id: facilityId }),
      });

      const json = (await res.json()) as {
        success: boolean;
        error: string | null;
      };

      if (!json.success) {
        setError(json.error ?? "Failed to add blood unit");
        return;
      }

      // Reset form
      setFormData({ blood_type: "O+", units_available: 1, expiry_timestamp: "" });
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="blood_type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Blood Type
        </label>
        <select
          id="blood_type"
          required
          value={formData.blood_type}
          onChange={(e) =>
            setFormData((d) => ({ ...d, blood_type: e.target.value as BloodType }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
        >
          {BLOOD_TYPES.map((bt) => (
            <option key={bt} value={bt}>
              {bt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="units_available"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Units Available
        </label>
        <input
          id="units_available"
          type="number"
          required
          min={1}
          max={999}
          value={formData.units_available}
          onChange={(e) =>
            setFormData((d) => ({
              ...d,
              units_available: parseInt(e.target.value, 10) || 1,
            }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div>
        <label
          htmlFor="expiry_timestamp"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Expiry Date & Time
        </label>
        <input
          id="expiry_timestamp"
          type="datetime-local"
          required
          value={formData.expiry_timestamp}
          min={new Date().toISOString().slice(0, 16)}
          onChange={(e) =>
            setFormData((d) => ({ ...d, expiry_timestamp: e.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Add Blood Unit
      </Button>
    </form>
  );
}
