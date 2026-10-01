/** All TypeScript interfaces for DamuLink entities */

export interface Facility {
  id: string;
  name: string;
  county: string;
  lat: number;
  lng: number;
  contact_phone: string;
  trust_score: number;
}

export interface BloodUnit {
  id: string;
  facility_id: string;
  blood_type: BloodType;
  units_available: number;
  expiry_timestamp: string;
  status: BloodUnitStatus;
  facility?: Facility;
}

export interface MatchRequest {
  id: string;
  donor_facility_id: string;
  receiver_facility_id: string;
  blood_type: BloodType;
  units_requested: number;
  status: MatchStatus;
  created_at: string;
  confidence_score?: number;
  donor_facility?: Facility;
  receiver_facility?: Facility;
}

export interface SurgicalSchedule {
  id: string;
  facility_id: string;
  procedure_name: string;
  scheduled_at: string;
  blood_type_needed: BloodType;
  units_needed: number;
  facility?: Facility;
}

export interface AuditLog {
  id: string;
  event_type: AuditEventType;
  facility_id: string | null;
  blood_unit_id: string | null;
  match_id: string | null;
  timestamp: string;
  notes: string | null;
  facility?: Facility;
}

export interface Donor {
  id: string;
  name: string;
  phone: string;
  blood_type: BloodType;
  county: string;
  last_donated_at: string | null;
}

export type BloodType =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export type BloodUnitStatus = "available" | "reserved" | "dispatched" | "expired";

export type MatchStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type AuditEventType =
  | "unit_added"
  | "unit_expired"
  | "match_created"
  | "match_confirmed"
  | "match_declined"
  | "match_delivered"
  | "sms_sent"
  | "sms_received"
  | "facility_registered"
  | "trust_score_updated";

/** Matching algorithm input/output types */
export interface MatchCandidate {
  facility: Facility;
  blood_unit: BloodUnit;
  distance_km: number;
  confidence_score: number;
  expiry_urgency_score: number;
  distance_score: number;
  receiver_need_score: number;
}

export interface MatchAlgorithmInput {
  donor_facility: Facility;
  blood_unit: BloodUnit;
  candidate_facilities: Facility[];
  candidate_units: BloodUnit[];
  surgical_schedules: SurgicalSchedule[];
}

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/** Dashboard stats */
export interface DashboardStats {
  total_units: number;
  expiring_24h: number;
  active_matches: number;
  trust_score: number;
}

/** SMS inbound payload from Africa's Talking */
export interface InboundSmsPayload {
  linkId: string;
  text: string;
  to: string;
  from: string;
  date: string;
  id: string;
}
