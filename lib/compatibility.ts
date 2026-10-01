import type { BloodType } from "@/types";

/**
 * ABO/Rh compatibility lookup table.
 * Key: donor blood type. Value: array of compatible recipient blood types.
 * Hard-coded per clinical transfusion rules — never inferred by AI.
 */
const COMPATIBILITY_MAP: Record<BloodType, BloodType[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/**
 * Determines whether a donor blood type is compatible with a recipient blood type.
 */
export function isCompatible(
  donorType: BloodType,
  recipientType: BloodType
): boolean {
  return COMPATIBILITY_MAP[donorType]?.includes(recipientType) ?? false;
}

/**
 * Returns all recipient blood types compatible with the given donor type.
 */
export function getCompatibleRecipients(donorType: BloodType): BloodType[] {
  return COMPATIBILITY_MAP[donorType] ?? [];
}

/**
 * Returns all donor blood types that can donate to the given recipient type.
 */
export function getCompatibleDonors(recipientType: BloodType): BloodType[] {
  return (Object.keys(COMPATIBILITY_MAP) as BloodType[]).filter((donor) =>
    COMPATIBILITY_MAP[donor].includes(recipientType)
  );
}
