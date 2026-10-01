import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { findMatches } from "@/lib/matching";
import { sendSms, buildMatchSms } from "@/lib/sms";
import type {
  ApiResponse,
  BloodUnit,
  Facility,
  MatchCandidate,
  SurgicalSchedule,
} from "@/types";

/**
 * POST /api/match
 * Runs the matching engine for a given blood unit.
 * Inserts match_requests and triggers SMS notifications.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { blood_unit_id: string };

    if (!body.blood_unit_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "blood_unit_id is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Fetch the blood unit
    const { data: unit, error: unitError } = await supabase
      .from("blood_units")
      .select("*, facility:facility_id(*)")
      .eq("id", body.blood_unit_id)
      .single();

    if (unitError || !unit) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Blood unit not found" },
        { status: 404 }
      );
    }

    const bloodUnit = unit as BloodUnit & { facility: Facility };

    // Fetch all available facilities
    const { data: facilities } = await supabase
      .from("facilities")
      .select("*");

    // Fetch active surgical schedules
    const { data: schedules } = await supabase
      .from("surgical_schedules")
      .select("*")
      .gte("scheduled_at", new Date().toISOString());

    const matches = findMatches({
      donor_facility: bloodUnit.facility,
      blood_unit: bloodUnit,
      candidate_facilities: (facilities ?? []) as Facility[],
      candidate_units: [],
      surgical_schedules: (schedules ?? []) as SurgicalSchedule[],
    });

    if (matches.length === 0) {
      return NextResponse.json<ApiResponse<MatchCandidate[]>>(
        { success: true, data: [], error: null },
        { status: 200 }
      );
    }

    // Insert match requests and trigger SMS for top match
    const insertedMatches: MatchCandidate[] = [];

    for (const match of matches) {
      const { data: inserted, error: insertError } = await supabase
        .from("match_requests")
        .insert({
          donor_facility_id: bloodUnit.facility.id,
          receiver_facility_id: match.facility.id,
          blood_type: bloodUnit.blood_type,
          units_requested: bloodUnit.units_available,
          status: "pending",
          confidence_score: match.confidence_score,
        })
        .select()
        .single();

      if (insertError) continue;

      // Audit log
      await supabase.from("audit_log").insert({
        event_type: "match_created",
        facility_id: bloodUnit.facility.id,
        blood_unit_id: bloodUnit.id,
        match_id: inserted.id,
        notes: `Match created: ${bloodUnit.blood_type} from ${bloodUnit.facility.name} to ${match.facility.name}. Confidence: ${(match.confidence_score * 100).toFixed(0)}%`,
      });

      // SMS to donor facility
      const donorSms = buildMatchSms(
        bloodUnit.facility.name,
        bloodUnit.blood_type,
        bloodUnit.units_available,
        match.facility.name,
        "donor"
      );
      await sendSms(bloodUnit.facility.contact_phone, donorSms);

      // SMS to receiver facility
      const receiverSms = buildMatchSms(
        match.facility.name,
        bloodUnit.blood_type,
        bloodUnit.units_available,
        bloodUnit.facility.name,
        "receiver"
      );
      await sendSms(match.facility.contact_phone, receiverSms);

      await supabase.from("audit_log").insert({
        event_type: "sms_sent",
        facility_id: bloodUnit.facility.id,
        match_id: inserted.id,
        notes: `SMS sent to both facilities for match ${inserted.id}`,
      });

      insertedMatches.push(match);
    }

    return NextResponse.json<ApiResponse<MatchCandidate[]>>(
      { success: true, data: insertedMatches, error: null },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
