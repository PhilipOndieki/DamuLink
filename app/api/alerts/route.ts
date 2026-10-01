import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { sendBulkSms } from "@/lib/sms";
import type { ApiResponse, Donor } from "@/types";

/**
 * POST /api/alerts
 * Sends bulk SMS to all donors of a specific blood type in a specific county.
 * Used by the admin donor-surge trigger.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      blood_type?: string;
      county?: string;
    };

    if (!body.blood_type || !body.county) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: "blood_type and county are required",
        },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: donors, error: donorError } = await supabase
      .from("donors")
      .select("id, name, phone, blood_type, county")
      .eq("blood_type", body.blood_type)
      .eq("county", body.county);

    if (donorError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: donorError.message },
        { status: 500 }
      );
    }

    if (!donors || donors.length === 0) {
      return NextResponse.json<ApiResponse<{ sent: number }>>(
        {
          success: true,
          data: { sent: 0 },
          error: null,
        },
        { status: 200 }
      );
    }

    const phones = (donors as Donor[]).map((d) => d.phone);
    const message =
      `[DamuLink URGENT] Hospitals in ${body.county} urgently need ${body.blood_type} blood. ` +
      `You are eligible to donate. Please visit your nearest facility today. ` +
      `Reply STOP to unsubscribe.`;

    const result = await sendBulkSms(phones, message);

    // Audit
    await supabase.from("audit_log").insert({
      event_type: "sms_sent",
      notes: `Donor surge SMS sent to ${result.sent} donors in ${body.county} for blood type ${body.blood_type}`,
    });

    return NextResponse.json<ApiResponse<{ sent: number; failed: number }>>(
      {
        success: true,
        data: { sent: result.sent, failed: result.failed },
        error: null,
      },
      { status: 200 }
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
