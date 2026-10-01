import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { findMatches } from "@/lib/matching";
import { sendSms, buildMatchSms } from "@/lib/sms";
import type { ApiResponse, BloodUnit, Facility, MatchRequest, SurgicalSchedule } from "@/types";

/**
 * PATCH /api/match/[id]
 * Updates match request status (confirmed / declined).
 * On decline, triggers next-best match.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { status: "confirmed" | "declined" };

    if (!body.status || !["confirmed", "declined"].includes(body.status)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "status must be confirmed or declined" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: match, error: matchError } = await supabase
      .from("match_requests")
      .update({ status: body.status })
      .eq("id", params.id)
      .select("*, donor_facility:donor_facility_id(*), receiver_facility:receiver_facility_id(*)")
      .single();

    if (matchError || !match) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Match not found" },
        { status: 404 }
      );
    }

    const typedMatch = match as MatchRequest & {
      donor_facility: Facility;
      receiver_facility: Facility;
    };

    // Audit the status change
    await supabase.from("audit_log").insert({
      event_type: body.status === "confirmed" ? "match_confirmed" : "match_declined",
      facility_id: typedMatch.receiver_facility_id,
      match_id: params.id,
      notes: `Match ${body.status} by ${typedMatch.receiver_facility?.name}`,
    });

    // If declined, find the next best match
    if (body.status === "declined") {
      const { data: bloodUnit } = await supabase
        .from("blood_units")
        .select("*, facility:facility_id(*)")
        .eq("facility_id", typedMatch.donor_facility_id)
        .eq("blood_type", typedMatch.blood_type)
        .eq("status", "available")
        .order("expiry_timestamp")
        .limit(1)
        .single();

      if (bloodUnit) {
        const { data: facilities } = await supabase.from("facilities").select("*");
        const { data: schedules } = await supabase
          .from("surgical_schedules")
          .select("*")
          .gte("scheduled_at", new Date().toISOString());

        // Exclude already-attempted receiver
        const candidates = ((facilities ?? []) as Facility[]).filter(
          (f) => f.id !== typedMatch.receiver_facility_id
        );

        const nextMatches = findMatches({
          donor_facility: (bloodUnit as BloodUnit & { facility: Facility }).facility,
          blood_unit: bloodUnit as BloodUnit,
          candidate_facilities: candidates,
          candidate_units: [],
          surgical_schedules: (schedules ?? []) as SurgicalSchedule[],
        });

        if (nextMatches.length > 0) {
          const nextMatch = nextMatches[0];
          const { data: newMatch } = await supabase
            .from("match_requests")
            .insert({
              donor_facility_id: typedMatch.donor_facility_id,
              receiver_facility_id: nextMatch.facility.id,
              blood_type: typedMatch.blood_type,
              units_requested: typedMatch.units_requested,
              status: "pending",
              confidence_score: nextMatch.confidence_score,
            })
            .select()
            .single();

          if (newMatch) {
            // SMS next-best receiver
            const sms = buildMatchSms(
              nextMatch.facility.name,
              typedMatch.blood_type,
              typedMatch.units_requested,
              typedMatch.donor_facility?.name ?? "Donor Facility",
              "receiver"
            );
            await sendSms(nextMatch.facility.contact_phone, sms);

            await supabase.from("audit_log").insert({
              event_type: "match_created",
              facility_id: typedMatch.donor_facility_id,
              match_id: newMatch.id,
              notes: `Next-best match triggered after decline. New receiver: ${nextMatch.facility.name}`,
            });
          }
        }
      }
    }

    return NextResponse.json<ApiResponse<MatchRequest>>(
      { success: true, data: typedMatch, error: null },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
