// src/lib/api.ts
import { getAdminToken } from "./adminSession";

// Base URL for your backend API (e.g., http://localhost:10000)

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
if (!BASE) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in frontend env (.env.local)");
}

/* =========================
   Shared types
   ========================= */

export type PriceType = "free" | "fixed" | "pay_what_you_feel";

export type Event = {
  id: string;
  title: string;

  // allow nulls from the API
  start: string | null;   // ISO or null
  end: string | null;     // ISO or null

  description?: string;
  location?: string;

  movieId?: string | null;

  // pricing/capacity (optional)
  priceType?: PriceType;
  pricePence?: number | null;
  capacity?: number | null;
  isPaid?: boolean;

  createdAt?: string;
  updatedAt?: string;
};

export type CreateEventInput = {
  title: string;
  description: string;
  start: string;   // ISO string
  end: string;     // ISO string
  location: string;
  /** optional TMDb link */
  movieId?: string | null;

  // optional pricing fields
  priceType?: PriceType;
  pricePence?: number | null;
  capacity?: number | null;
  isPaid?: boolean;
};

export type UpdateEventInput = CreateEventInput;

export type SignupInput = {
  eventId: string;
  name: string;
  email: string;
  amountPence?: number;
};

export type AdminLoginResponse = {
  token: string;
  expiresAt: string;
};

function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "error" in error) {
    const value = (error as { error?: unknown }).error;
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  return fallback;
}

async function readApiError(response: Response, fallback: string) {
  try {
    return extractErrorMessage(await response.json(), fallback);
  } catch {
    return fallback;
  }
}

function requireAdminToken() {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Please log in as an admin to continue.");
  }
  return token;
}

function adminJsonHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${requireAdminToken()}`,
  };
}

function adminHeaders() {
  return {
    Authorization: `Bearer ${requireAdminToken()}`,
  };
}

/* =========================
   Admin session
   ========================= */

export async function loginAdmin(passcode: string): Promise<AdminLoginResponse> {
  const r = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });

  if (!r.ok) {
    throw new Error(await readApiError(r, "Admin login failed"));
  }

  return (await r.json()) as AdminLoginResponse;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(`${BASE}/admin/logout`, { method: "POST" });
  } catch {
    // Logout is stateless server-side; local session clearing happens in the UI.
  }
}

/* =========================
   Events
   ========================= */

export async function listEvents(): Promise<Event[]> {
  const r = await fetch(`${BASE}/events`, { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load events");
  const data = await r.json();
  return Array.isArray(data) ? (data as Event[]) : (data.events as Event[]);
}

export async function getEvent(id: string): Promise<Event> {
  const r = await fetch(`${BASE}/events/${id}`, { cache: "no-store" });
  if (!r.ok) throw new Error("Not found");
  return (await r.json()) as Event;
}

export async function createEvent(payload: CreateEventInput): Promise<Event> {
  const r = await fetch(`${BASE}/events`, {
    method: "POST",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    throw new Error(await readApiError(r, "Create event failed"));
  }
  return (await r.json()) as Event;
}

export async function updateEvent(id: string, payload: UpdateEventInput): Promise<Event> {
  const r = await fetch(`${BASE}/events/${id}`, {
    method: "PUT",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    throw new Error(await readApiError(r, "Update event failed"));
  }
  return (await r.json()) as Event;
}

/* =========================
   Signups / Checkout
   ========================= */

export async function createSignup(payload: SignupInput) {
  const r = await fetch(`${BASE}/signups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    throw new Error(await readApiError(r, "Signup failed"));
  }
  return r.json();
}

export async function startCheckout(eventTitle: string, amountPence: number): Promise<{ url: string }> {
  const r = await fetch(`${BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventTitle, amountPence }),
  });
  if (!r.ok) {
    throw new Error(await readApiError(r, "Checkout failed"));
  }
  return r.json() as Promise<{ url: string }>;
}

/* =========================
   TMDb (via backend)
   Endpoints provided by your backend:
   - GET /tmdb/search?query=...
   - GET /tmdb/movie/:id
   ========================= */

export type TmdbSearchHit = {
  id: number;
  title: string;
  releaseDate: string | null;
  posterPath: string | null;
};

export async function searchMovies(query: string): Promise<{ results: TmdbSearchHit[] }> {
  const url = `${BASE}/tmdb/search?query=${encodeURIComponent(query)}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`searchMovies failed: ${r.status}`);
  return (await r.json()) as { results: TmdbSearchHit[] };
}

export type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  runtime: number | null;
  releaseDate: string | null;
  posterPath: string | null;
  genres: string[];
};

export async function fetchMovie(id: string | number): Promise<TmdbMovie> {
  const r = await fetch(`${BASE}/tmdb/movie/${id}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`fetchMovie failed: ${r.status}`);
  return (await r.json()) as TmdbMovie;
}

/** Build a TMDb poster URL when you have posterPath (e.g. '/abc123.jpg') */
export function tmdbPosterUrl(posterPath: string | null, size: "w185" | "w342" | "w500" = "w342") {
  return posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : null;
}

/* =========================
   Simplified Movie Basics
   For event listings (title + poster thumbnail)
   ========================= */

export type MovieBasics = {
  id: string;
  title: string;
  posterUrl?: string;
  releaseDate?: string;
};

export async function getMovieBasics(movieId: string): Promise<MovieBasics | null> {
  try {
    const r = await fetch(`${BASE}/tmdb/movie/${movieId}`, { cache: "no-store" });
    if (!r.ok) return null;
    const data = await r.json();
    return {
      id: String(data.id),
      title: data.title ?? data.name ?? "Untitled",
      posterUrl: data.posterUrl ?? (data.posterPath ? tmdbPosterUrl(data.posterPath, "w185") ?? undefined : undefined),
      releaseDate: data.release_date ?? data.releaseDate ?? data.first_air_date ?? undefined,
    };
  } catch {
    return null;
  }
}

/* =========================
   Delete event
   ========================= */

export async function deleteEvent(id: string): Promise<void> {
  const r = await fetch(`${BASE}/events/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!r.ok) {
    throw new Error(await readApiError(r, "Delete event failed"));
  }
}
