/** Africa's Talking SMS wrapper for DamuLink */

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BulkSmsResult {
  success: boolean;
  sent: number;
  failed: number;
  error?: string;
}

/**
 * Sends an SMS to a single recipient via Africa's Talking.
 * Queues through Supabase edge function to prevent API timeout under load.
 */
export async function sendSms(
  to: string,
  message: string
): Promise<SmsResult> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;
  const senderId = process.env.AFRICASTALKING_SENDER_ID ?? "DamuLink";

  if (!apiKey || !username) {
    console.warn("Africa's Talking credentials not configured");
    return { success: false, error: "SMS credentials not configured" };
  }

  try {
    // Normalize Kenyan phone numbers to international format
    const normalizedPhone = normalizePhone(to);

    const params = new URLSearchParams({
      username,
      to: normalizedPhone,
      message,
      from: senderId,
    });

    const response = await fetch(
      "https://api.africastalking.com/version1/messaging",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey,
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    const data = (await response.json()) as {
      SMSMessageData?: {
        Recipients?: Array<{ messageId: string; status: string }>;
      };
    };

    const recipient = data.SMSMessageData?.Recipients?.[0];
    if (recipient?.status === "Success") {
      return { success: true, messageId: recipient.messageId };
    }

    return { success: false, error: "Recipient status not Success" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Sends bulk SMS to multiple recipients in a single API call.
 */
export async function sendBulkSms(
  recipients: string[],
  message: string
): Promise<BulkSmsResult> {
  if (recipients.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;
  const senderId = process.env.AFRICASTALKING_SENDER_ID ?? "DamuLink";

  if (!apiKey || !username) {
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      error: "SMS credentials not configured",
    };
  }

  try {
    const normalizedPhones = recipients.map(normalizePhone).join(",");

    const params = new URLSearchParams({
      username,
      to: normalizedPhones,
      message,
      from: senderId,
    });

    const response = await fetch(
      "https://api.africastalking.com/version1/messaging",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey,
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        error: `HTTP ${response.status}: ${text}`,
      };
    }

    const data = (await response.json()) as {
      SMSMessageData?: {
        Recipients?: Array<{ status: string }>;
      };
    };

    const allRecipients = data.SMSMessageData?.Recipients ?? [];
    const sent = allRecipients.filter((r) => r.status === "Success").length;
    const failed = allRecipients.length - sent;

    return { success: true, sent, failed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      error: message,
    };
  }
}

/**
 * Normalizes Kenyan phone numbers to E.164 format (+254...).
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1"))
    return `+254${digits}`;
  return `+${digits}`;
}

/**
 * Builds match notification SMS for facility managers.
 */
export function buildMatchSms(
  facilityName: string,
  bloodType: string,
  units: number,
  partnerFacility: string,
  role: "donor" | "receiver"
): string {
  if (role === "donor") {
    return (
      `[DamuLink] URGENT: ${units} units of ${bloodType} expiring soon. ` +
      `${partnerFacility} needs them. Reply YES to confirm dispatch or NO to decline.`
    );
  }
  return (
    `[DamuLink] BLOOD AVAILABLE: ${units} units of ${bloodType} from ` +
    `${partnerFacility} en route to ${facilityName}. Reply YES to confirm receipt or NO to cancel.`
  );
}
