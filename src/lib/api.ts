// src/lib/api.ts

// Base URL for your backend API (e.g., http://localhost:10000)

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
if (!BASE) {
  
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in frontend env (.env.local)");
}

/* =========================
   Shared types
   ========================= */

export type PriceType = "free" | "fixed" | "donation";

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

export type SignupInput = {
  eventId: string;
  name: string;
  email: string;
  amountPence?: number;
};

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

export async function createEvent(
  payload: CreateEventInput,
  adminPass: string
): Promise<Event> {
  if (!adminPass || !adminPass.trim()) {
    throw new Error("Missing admin passcode (frontend)");
  }

  const r = await fetch(`${BASE}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-passcode": adminPass.trim(),
    },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    let message = "Create event failed";
    try {
      const e = await r.json();
      if (e?.error)
        message =
          typeof e.error === "string" ? e.error : JSON.stringify(e.error);
    } catch {}
    throw new Error(message);
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
    let message = "Signup failed";
    try {
      const e = await r.json();
      if (e?.error) message = typeof e.error === "string" ? e.error : JSON.stringify(e.error);
    } catch {}
    throw new Error(message);
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
    let message = "Checkout failed";
    try {
      const e = await r.json();
      if (e?.error) message = typeof e.error === "string" ? e.error : JSON.stringify(e.error);
    } catch {}
    throw new Error(message);
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

export async function deleteEvent(id: string, adminPass: string): Promise<void> {
  if (!adminPass || !adminPass.trim()) {
    throw new Error("Missing admin passcode (frontend)");
  }
  const r = await fetch(`${BASE}/events/${id}`, {
    method: "DELETE",
    headers: { "x-admin-passcode": adminPass.trim() },
  });
  if (!r.ok) {
    let message = "Delete event failed";
    try {
      const e = await r.json();
      if (e?.error) message = typeof e.error === "string" ? e.error : JSON.stringify(e.error);
    } catch {}
    throw new Error(message);
  }
}


