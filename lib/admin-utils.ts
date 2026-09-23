export function parseTimestamp(value: unknown): Date | undefined {
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === "function") {
      try {
        return obj.toDate() as Date;
      } catch {
        return undefined;
      }
    }
    if (typeof obj.seconds === "number" && typeof obj.nanos === "number") {
      try {
        return new Date(obj.seconds * 1000 + obj.nanos / 1e6);
      } catch {
        return undefined;
      }
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export function safeString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

export function safeNumber(value: unknown): number {
  if (value === undefined || value === null) return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

export function verifyAdmin(
  decodedToken: { uid: string },
  adminUserData: Record<string, unknown> | undefined
): boolean {
  return (
    adminUserData?.role === "admin" ||
    adminUserData?.isAdmin === true ||
    decodedToken.uid === process.env.ADMIN_UID
  );
}

export function safeParseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function safeDateFormat(value: unknown): string {
  const d = safeParseDate(value);
  if (!d) return "N/A";
  try {
    return d.toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

export function safeFormatTime(value: unknown): string {
  const d = safeParseDate(value);
  if (!d) return "";
  try {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return "Just now";
    if (diffMs < 60 * 1000) return "Just now";
    if (diffMs < 60 * 60 * 1000)
      return `${Math.floor(diffMs / (60 * 1000))}m ago`;
    if (diffMs < 24 * 60 * 60 * 1000)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
