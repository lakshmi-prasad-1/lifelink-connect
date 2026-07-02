export const compatibleDonorGroupsByRecipient: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export const compatibleRecipientGroupsByDonor: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

export function normalizeBloodGroup(bloodGroup: string) {
  return bloodGroup.trim().toUpperCase();
}

export function normalizeLocation(location: string) {
  return location.trim().toLowerCase();
}

export function getCompatibleDonorGroups(recipientBloodGroup: string) {
  const normalizedGroup = normalizeBloodGroup(recipientBloodGroup);
  return compatibleDonorGroupsByRecipient[normalizedGroup] || [normalizedGroup];
}

export function getCompatibleRecipientGroups(donorBloodGroup: string) {
  const normalizedGroup = normalizeBloodGroup(donorBloodGroup);
  return compatibleRecipientGroupsByDonor[normalizedGroup] || [normalizedGroup];
}

export function isDonorEligible(lastDonation: string | null): boolean {
  if (!lastDonation) return true;
  const last = new Date(lastDonation);
  const now = new Date();
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 90;
}
