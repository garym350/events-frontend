// src/lib/dates.ts

/** Safely format an ISO string. Falls back when missing/invalid. */
function formatGbDateTime(iso: string | null | undefined, fallback: string) {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;

  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${day}/${month}/${year}, ${time}`;
}

export function formatDateTime(
  iso?: string | null,
  fallback: string = "Date TBA"
) {
  return formatGbDateTime(iso, fallback);
}

/** Shorter variant for list views. Also safe. */
export function formatDateTimeShort(
  iso?: string | null,
  fallback: string = "Date TBA"
) {
  return formatGbDateTime(iso, fallback);
}
