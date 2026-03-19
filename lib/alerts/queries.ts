export async function getAlertList() {
  return [] as Array<{
    id: string;
    title: string;
    message: string;
    severity: string;
    status: string;
    category: string;
    createdAt: Date;
    visibleToCareTeam: boolean;
    rule?: { name?: string | null } | null;
    sourceType?: string | null;
    sourceId?: string | null;
  }>;
}

export async function getAlertDetail() {
  return null;
}

export async function getAlertRules() {
  return [] as Array<{
    id: string;
    name: string;
    category: string;
    severity: string;
    cooldownMinutes: number;
    lookbackHours: number;
    visibleToCareTeam: boolean;
  }>;
}