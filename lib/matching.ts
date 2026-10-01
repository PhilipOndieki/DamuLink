import type {
  BloodUnit,
  Facility,
  MatchAlgorithmInput,
  MatchCandidate,
  SurgicalSchedule,
} from "@/types";
import { isCompatible } from "./compatibility";
import { haversineDistance } from "./haversine";

const MAX_DISTANCE_KM = 50;
const EXPIRY_URGENCY_WEIGHT = 0.5;
const DISTANCE_WEIGHT = 0.3;
const RECEIVER_NEED_WEIGHT = 0.2;

/**
 * Calculates expiry urgency score (0–1).
 * Score increases as the unit approaches expiry.
 * Units expiring in <6h score 1.0; >72h score 0.
 */
function calcExpiryUrgency(expiryTimestamp: string): number {
  const now = Date.now();
  const expiry = new Date(expiryTimestamp).getTime();
  const hoursRemaining = (expiry - now) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return 1.0;
  if (hoursRemaining >= 72) return 0;
  return 1 - hoursRemaining / 72;
}

/**
 * Calculates distance score (0–1).
 * Closer facilities score higher. Beyond MAX_DISTANCE_KM returns 0.
 */
function calcDistanceScore(distanceKm: number): number {
  if (distanceKm >= MAX_DISTANCE_KM) return 0;
  return 1 - distanceKm / MAX_DISTANCE_KM;
}

/**
 * Calculates receiver need urgency score (0–1) based on upcoming surgical schedules.
 * Procedures scheduled in <12h score 1.0; >48h score 0.
 */
function calcReceiverNeedScore(
  facility: Facility,
  bloodType: string,
  schedules: SurgicalSchedule[]
): number {
  const facilitySchedules = schedules.filter(
    (s) => s.facility_id === facility.id && s.blood_type_needed === bloodType
  );

  if (facilitySchedules.length === 0) return 0;

  const now = Date.now();
  const soonest = facilitySchedules
    .map((s) => new Date(s.scheduled_at).getTime())
    .sort((a, b) => a - b)[0];

  const hoursUntil = (soonest - now) / (1000 * 60 * 60);
  if (hoursUntil <= 0) return 1.0;
  if (hoursUntil >= 48) return 0;
  return 1 - hoursUntil / 48;
}

/**
 * Calculates weighted confidence score (0–1).
 */
function calcConfidenceScore(
  expiryUrgency: number,
  distanceScore: number,
  receiverNeedScore: number
): number {
  return (
    expiryUrgency * EXPIRY_URGENCY_WEIGHT +
    distanceScore * DISTANCE_WEIGHT +
    receiverNeedScore * RECEIVER_NEED_WEIGHT
  );
}

/**
 * Pure matching algorithm. Stateless — never queries the database.
 * Accepts any arrays of facilities, blood units, and surgical schedules.
 * Returns top 3 match candidates ranked by confidence score.
 */
export function findMatches(input: MatchAlgorithmInput): MatchCandidate[] {
  const { donor_facility, blood_unit, candidate_facilities, surgical_schedules } =
    input;

  const candidates: MatchCandidate[] = [];

  for (const facility of candidate_facilities) {
    // Exclude the donor facility itself
    if (facility.id === donor_facility.id) continue;

    // Filter by blood type compatibility
    if (!isCompatible(blood_unit.blood_type, blood_unit.blood_type)) {
      // We look for receiver facilities that need this blood type (compatible)
    }

    const distance = haversineDistance(
      donor_facility.lat,
      donor_facility.lng,
      facility.lat,
      facility.lng
    );

    if (distance > MAX_DISTANCE_KM) continue;

    const expiryUrgency = calcExpiryUrgency(blood_unit.expiry_timestamp);
    const distanceScore = calcDistanceScore(distance);
    const receiverNeedScore = calcReceiverNeedScore(
      facility,
      blood_unit.blood_type,
      surgical_schedules
    );
    const confidenceScore = calcConfidenceScore(
      expiryUrgency,
      distanceScore,
      receiverNeedScore
    );

    candidates.push({
      facility,
      blood_unit,
      distance_km: distance,
      confidence_score: confidenceScore,
      expiry_urgency_score: expiryUrgency,
      distance_score: distanceScore,
      receiver_need_score: receiverNeedScore,
    });
  }

  // Rank by expiry urgency first, then confidence score
  return candidates
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 3);
}

/**
 * Finds facilities that need a specific blood type, across all compatible types.
 * Filters candidate units for compatible blood types.
 */
export function findCompatibleUnits(
  receiverBloodType: string,
  units: BloodUnit[]
): BloodUnit[] {
  return units.filter(
    (u) =>
      u.status === "available" &&
      isCompatible(u.blood_type, receiverBloodType as BloodUnit["blood_type"])
  );
}
