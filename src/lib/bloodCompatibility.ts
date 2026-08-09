export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

// Who a donor of this group can give to.
const DONOR_TO_RECIPIENTS: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/** Every recipient blood group a donor of `donorGroup` can safely give to. */
export function getCompatibleRecipientGroups(donorGroup: string): BloodGroup[] {
  return DONOR_TO_RECIPIENTS[donorGroup as BloodGroup] ?? [];
}

/** Every donor blood group that can safely give to a patient needing `recipientGroup`. */
export function getCompatibleDonorGroups(recipientGroup: string): BloodGroup[] {
  return BLOOD_GROUPS.filter((donor) => DONOR_TO_RECIPIENTS[donor].includes(recipientGroup as BloodGroup));
}

export function isCompatibleDonor(donorGroup: string, recipientGroup: string): boolean {
  return getCompatibleRecipientGroups(donorGroup).includes(recipientGroup as BloodGroup);
}
