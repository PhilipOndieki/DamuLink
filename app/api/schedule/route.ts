import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import type { ApiResponse, SurgicalSchedule } from "@/types";

/**
 * POST /api/schedule
 * Adds a new surgical schedule entry and triggers matching for the required blood type.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      facility_id: string;
      procedure_name: string;
      scheduled_at: string;
      blood_type_needed: string;
      units_needed: number;
    };

    if (
      !body.facility_id ||
      !body.procedure_name ||
      !body.scheduled_at ||
      !body.blood_type_needed ||
      !body.units_needed
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "All fields are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: schedule, error } = await supabase
      .from("surgical_schedules")
      .insert({
        facility_id: body.facility_id,
        procedure_name: body.procedure_name,
        scheduled_at: new Date(body.scheduled_at).toISOString(),
        blood_type_needed: body.blood_type_needed,
        units_needed: body.units_needed,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    // Check if there are matching available blood units to trigger a match
    const { data: matchingUnits } = await supabase
      .from("blood_units")
      .select("id")
      .eq("blood_type", body.blood_type_needed)
      .eq("status", "available")
      .neq("facility_id", body.facility_id)
      .order("expiry_timestamp")
      .limit(1);

    if (matchingUnits && matchingUnits.length > 0) {
      // Trigger matching for the most urgent available unit
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/match`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blood_unit_id: matchingUnits[0].id }),
        }
      ).catch(() => {});
    }

    return NextResponse.json<ApiResponse<SurgicalSchedule>>(
      {
        success: true,
        data: schedule as SurgicalSchedule,
        error: null,
      },
      { status: 201 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
