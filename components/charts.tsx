"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

type GenericDatum = Record<string, string | number | null | undefined>;

const LINE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0f766e",
  "#dc2626",
  "#ea580c",
  "#0891b2",
];

function formatAxisLabel(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return String(value ?? "");
}

function formatTooltipValue(value: ValueType) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }

  if (typeof value === "string") {
    return value;
  }

  return "—";
}

function ChartShell({
  children,
  empty,
}: {
  children: React.ReactNode;
  empty?: boolean;
}) {
  if (empty) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-[24px] border border-dashed border-border/70 bg-background/30 p-6">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-foreground">No chart data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            As records are added, trends will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[240px] rounded-[24px] border border-border/60 bg-background/30 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      {children}
    </div>
  );
}

function PremiumTooltip({
  active,
  payload,
  label,
  valueSuffix,
}: TooltipProps<ValueType, NameType> & {
  valueSuffix?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="min-w-[180px] rounded-2xl border border-border/70 bg-background/95 p-3 shadow-xl backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {formatAxisLabel(label)}
      </p>

      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color ?? LINE_COLORS[index % LINE_COLORS.length] }}
              />
              <span className="text-sm text-foreground/85">
                {String(entry.name ?? "Value")}
              </span>
            </div>

            <span className="text-sm font-semibold text-foreground">
              {formatTooltipValue(entry.value)}
              {valueSuffix ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function baseChartMargins() {
  return { top: 12, right: 12, left: -12, bottom: 0 };
}

export function TrendChart({
  data,
  lines,
}: {
  data: GenericDatum[];
  lines: { key: string; name: string }[];
}) {
  const isEmpty = !data?.length;

  return (
    <ChartShell empty={isEmpty}>
      {!isEmpty ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={baseChartMargins()}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              stroke="currentColor"
              className="text-muted-foreground"
              width={42}
            />
            <Tooltip
              content={<PremiumTooltip />}
              cursor={{ stroke: "rgba(148,163,184,0.3)", strokeDasharray: "4 4" }}
            />

            {lines.map((line, index) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 0 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </ChartShell>
  );
}

export function AreaTrendChart({
  data,
  keyName,
  name,
}: {
  data: GenericDatum[];
  keyName: string;
  name: string;
}) {
  const isEmpty = !data?.length;

  return (
    <ChartShell empty={isEmpty}>
      {!isEmpty ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={baseChartMargins()}>
            <defs>
              <linearGradient id={`fill-${keyName}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              stroke="currentColor"
              className="text-muted-foreground"
              width={42}
            />
            <Tooltip
              content={<PremiumTooltip />}
              cursor={{ stroke: "rgba(148,163,184,0.3)", strokeDasharray: "4 4" }}
            />

            <Area
              type="monotone"
              dataKey={keyName}
              name={name}
              stroke="#2563eb"
              strokeWidth={2.5}
              fill={`url(#fill-${keyName})`}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : null}
    </ChartShell>
  );
}

export function AdherenceChart({
  data,
}: {
  data: GenericDatum[];
}) {
  const isEmpty = !data?.length;

  return (
    <ChartShell empty={isEmpty}>
      {!isEmpty ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={baseChartMargins()} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              stroke="currentColor"
              className="text-muted-foreground"
              width={38}
            />
            <Tooltip
              content={<PremiumTooltip />}
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
            />

            <Bar
              dataKey="taken"
              name="Taken"
              radius={[10, 10, 4, 4]}
              fill="#2563eb"
            />
            <Bar
              dataKey="missed"
              name="Missed"
              radius={[10, 10, 4, 4]}
              fill="#dc2626"
            />
            <Bar
              dataKey="skipped"
              name="Skipped"
              radius={[10, 10, 4, 4]}
              fill="#7c3aed"
            />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </ChartShell>
  );
}