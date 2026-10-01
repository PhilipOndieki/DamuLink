import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import type { ApiResponse, InboundSmsPayload } from "@/types";

/**
 * POST /api/sms
 * Africa's Talking inbound SMS webhook.
 * Parses YES/NO reply and updates the latest pending match for that phone number.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Africa's Talking sends form-urlencoded data
    const contentType = request.headers.get("content-type") ?? "";
    let payload: Partial<InboundSmsPayload>;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      payload = {
        linkId: params.get("linkId") ?? undefined,
        text: params.get("text") ?? undefined,
        to: params.get("to") ?? undefined,
        from: params.get("from") ?? undefined,
        date: params.get("date") ?? undefined,
        id: params.get("id") ?? undefined,
      };
    } else {
      payload = (await request.json()) as Partial<InboundSmsPayload>;
    }

    if (!payload.from || !payload.text) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "Missing required SMS fields" },
        { status: 400 }
      );
    }

    const reply = payload.text.trim().toUpperCase();
    const phone = normalizePhone(payload.from);

    if (reply !== "YES" && reply !== "NO") {
      // Unrecognized reply — ignore silently
      return NextResponse.json<ApiResponse<null>>(
        { success: true, data: null, error: null },
        { status: 200 }
      );
    }

    const supabase = getServiceSupabase();

    // Find the facility associated with this phone number
    const { data: facility } = await supabase
      .from("facilities")
      .select("id, name")
      .eq("contact_phone", phone)
      .single();

    if (!facility) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "No facility found for this phone" },
        { status: 404 }
      );
    }

    // Find the most recent pending match where this facility is the receiver
    const { data: match } = await supabase
      .from("match_requests")
      .select("id, blood_type, units_requested")
      .eq("receiver_facility_id", facility.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!match) {
      return NextResponse.json<ApiResponse<null>>(
        { success: true, data: null, error: null },
        { status: 200 }
      );
    }

    const newStatus = reply === "YES" ? "confirmed" : "declined";

    await supabase
      .from("match_requests")
      .update({ status: newStatus })
      .eq("id", match.id);

    await supabase.from("audit_log").insert({
      event_type: newStatus === "confirmed" ? "match_confirmed" : "match_declined",
      facility_id: facility.id,
      match_id: match.id,
      notes: `SMS ${reply} received from ${phone} — match ${newStatus}`,
    });

    // If declined, trigger next-best match via the match endpoint
    if (newStatus === "declined") {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/match/${match.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "declined" }),
        }
      );
    }

    return NextResponse.json<ApiResponse<{ status: string }>>(
      { success: true, data: { status: newStatus }, error: null },
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

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  return `+${digits}`;
}
