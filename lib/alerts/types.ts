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
  sourceHref?: string | null;
  sourceSummary?: string | null;
};

export type AlertAuditLogItem = {
  id: string;
  action: string;
  createdAt: Date;
  note?: string | null;
  metadataJson?: string | null;
  actor?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

export type AlertDetail = AlertListItem & {
  contextJson?: string | null;
  ownerAcknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
  dismissedAt?: Date | null;
  sourceRecordedAt?: Date | null;
  auditLogs: AlertAuditLogItem[];
};
