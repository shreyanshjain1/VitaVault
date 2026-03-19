export type AlertListItem = {
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
};

export type AlertDetail = AlertListItem & {
  contextJson?: string | null;
  ownerAcknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
  dismissedAt?: Date | null;
  auditLogs: Array<{
    id: string;
    action: string;
    createdAt: Date;
    note?: string | null;
    metadataJson?: string | null;
  }>;
};