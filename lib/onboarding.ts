export type OnboardingChecklistItem = {
  key: string;
  title: string;
  description: string;
  complete: boolean;
};

export type OnboardingProfile = {
  fullName?: string | null;
  dateOfBirth?: Date | null;
  sex?: string | null;
  bloodType?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  chronicConditions?: string | null;
  allergiesSummary?: string | null;
  notes?: string | null;
} | null;

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function getOnboardingChecklist(profile: OnboardingProfile): OnboardingChecklistItem[] {
  return [
    {
      key: "identity",
      title: "Identity basics",
      description: "Name, birth date, sex, and blood type are used across summaries and reports.",
      complete: Boolean(
        hasValue(profile?.fullName) &&
          hasValue(profile?.dateOfBirth) &&
          hasValue(profile?.sex) &&
          hasValue(profile?.bloodType)
      ),
    },
    {
      key: "baseline",
      title: "Physical baseline",
      description: "Height and weight help make future vitals, trends, and exports more useful.",
      complete: Boolean(hasValue(profile?.heightCm) && hasValue(profile?.weightKg)),
    },
    {
      key: "safety",
      title: "Safety context",
      description: "Allergies and chronic conditions provide context for caregivers and doctor visits.",
      complete: Boolean(hasValue(profile?.allergiesSummary) || hasValue(profile?.chronicConditions)),
    },
    {
      key: "emergency",
      title: "Emergency contact",
      description: "A named emergency contact makes the patient summary and future emergency card stronger.",
      complete: Boolean(
        hasValue(profile?.emergencyContactName) && hasValue(profile?.emergencyContactPhone)
      ),
    },
  ];
}

export function getOnboardingProgress(profile: OnboardingProfile) {
  const checklist = getOnboardingChecklist(profile);
  const complete = checklist.filter((item) => item.complete).length;
  const total = checklist.length;

  return {
    checklist,
    complete,
    total,
    percentage: total > 0 ? Math.round((complete / total) * 100) : 0,
  };
}

export function formatDateInput(date: Date | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}
