"use client";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
export function TrendChart({ data, lines }: { data: any[]; lines: { key: string; name: string }[] }) {
  return <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="4 4" opacity={0.15} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} /><Tooltip />{lines.map(line => <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke="currentColor" strokeWidth={2} />)}</LineChart></ResponsiveContainer></div>;
}
export function AreaTrendChart({ data, keyName, name }: { data: any[]; keyName: string; name: string }) {
  return <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><CartesianGrid strokeDasharray="4 4" opacity={0.15} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Area type="monotone" dataKey={keyName} name={name} stroke="currentColor" fill="currentColor" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></div>;
}
export function AdherenceChart({ data }: { data: any[] }) {
  return <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="4 4" opacity={0.15} /><XAxis dataKey="label" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="taken" name="Taken" fill="currentColor" opacity={0.9} /><Bar dataKey="missed" name="Missed" fill="currentColor" opacity={0.35} /></BarChart></ResponsiveContainer></div>;
}
