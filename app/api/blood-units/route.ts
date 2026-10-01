import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import type { ApiResponse, BloodUnit } from "@/types";

/**
 * POST /api/blood-units
 * Adds a new blood unit and triggers the matching engine.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      facility_id: string;
      blood_type: string;
      units_available: number;
      expiry_timestamp: string;
    };

    if (
      !body.facility_id ||
      !body.blood_type ||
      !body.units_available ||
      !body.expiry_timestamp
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "All fields are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: unit, error } = await supabase
      .from("blood_units")
      .insert({
        facility_id: body.facility_id,
        blood_type: body.blood_type,
        units_available: body.units_available,
        expiry_timestamp: new Date(body.expiry_timestamp).toISOString(),
        status: "available",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    // Audit
    await supabase.from("audit_log").insert({
      event_type: "unit_added",
      facility_id: body.facility_id,
      blood_unit_id: unit.id,
      notes: `${body.units_available} units of ${body.blood_type} added, expires ${new Date(body.expiry_timestamp).toLocaleString()}`,
    });

    // Trigger matching engine asynchronously
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/match`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blood_unit_id: unit.id }),
      }
    ).catch(() => {
      // Non-blocking — matching failures are logged separately
    });

    return NextResponse.json<ApiResponse<BloodUnit>>(
      { success: true, data: unit as BloodUnit, error: null },
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
