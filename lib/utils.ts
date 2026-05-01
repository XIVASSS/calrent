import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRentCompact(amount: number) {
  if (!Number.isFinite(amount)) return "—";
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `₹${amount}`;
}

export function maskPhone(phone?: string | null) {
  if (!phone) return "•••••• ••••";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••••• ••••";
  return `+•• ••••• ${digits.slice(-3)}`;
}

export function maskEmail(email?: string | null) {
  if (!email) return "•••@••••";
  const [user, domain] = email.split("@");
  if (!domain) return "•••@••••";
  const head = user.slice(0, 1);
  return `${head}${"•".repeat(Math.max(2, user.length - 1))}@${domain}`;
}

export function relativeTime(input: string | Date | null | undefined) {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
