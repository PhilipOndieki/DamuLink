"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { BloodType } from "@/types";

const BLOOD_TYPES: BloodType[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
];

interface ScheduleFormProps {
  facilityId: string;
  onSuccess?: () => void;
}

/** Form for adding an upcoming surgical procedure with blood requirements */
export function ScheduleForm({ facilityId, onSuccess }: ScheduleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    procedure_name: "",
    scheduled_at: "",
    blood_type_needed: "O+" as BloodType,
    units_needed: 2,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, facility_id: facilityId }),
      });

      const json = (await res.json()) as {
        success: boolean;
        error: string | null;
      };

      if (!json.success) {
        setError(json.error ?? "Failed to add schedule");
        return;
      }

      setFormData({
        procedure_name: "",
        scheduled_at: "",
        blood_type_needed: "O+",
        units_needed: 2,
      });
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
          htmlFor="procedure_name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Procedure Name
        </label>
        <input
          id="procedure_name"
          type="text"
          required
          placeholder="e.g. Emergency Splenectomy"
          value={formData.procedure_name}
          onChange={(e) =>
            setFormData((d) => ({ ...d, procedure_name: e.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div>
        <label
          htmlFor="scheduled_at"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Scheduled Date & Time
        </label>
        <input
          id="scheduled_at"
          type="datetime-local"
          required
          value={formData.scheduled_at}
          onChange={(e) =>
            setFormData((d) => ({ ...d, scheduled_at: e.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="blood_type_needed"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Blood Type Needed
          </label>
          <select
            id="blood_type_needed"
            required
            value={formData.blood_type_needed}
            onChange={(e) =>
              setFormData((d) => ({
                ...d,
                blood_type_needed: e.target.value as BloodType,
              }))
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
            htmlFor="units_needed"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Units Needed
          </label>
          <input
            id="units_needed"
            type="number"
            required
            min={1}
            max={99}
            value={formData.units_needed}
            onChange={(e) =>
              setFormData((d) => ({
                ...d,
                units_needed: parseInt(e.target.value, 10) || 1,
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          />
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Add Surgical Schedule
      </Button>
    </form>
  );
}
