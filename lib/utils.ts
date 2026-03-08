import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(date?: Date | string | null, pattern = "MMM d, yyyy") { return date ? format(new Date(date), pattern) : "—"; }
export function formatDateTime(date?: Date | string | null) { return date ? format(new Date(date), "MMM d, yyyy • h:mm a") : "—"; }
export function bpLabel(s?: number | null, d?: number | null) { return s && d ? `${s}/${d}` : "—"; }
