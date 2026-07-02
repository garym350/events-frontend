import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  deleteEvent,
  getEvent,
  updateEvent,
  searchMovies,
  logoutAdmin,
  type Event,
  type PriceType,
  type TmdbSearchHit,
  type UpdateEventInput,
} from "@/lib/api";
import { clearAdminSession, getAdminSession } from "@/lib/adminSession";
import { formatDateTimeShort } from "@/lib/dates";

type FormState = {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  movieId: string;
  priceType: PriceType;
  pricePence: string;
  capacity: string;
};

function toLocalDateTimeValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoFromLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

const MAX_EVENT_YEARS_AHEAD = 5;

function toLocalDateTimeInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getEventDateBounds() {
  const now = new Date();
  now.setSeconds(0, 0);
  const max = new Date(now);
  max.setFullYear(max.getFullYear() + MAX_EVENT_YEARS_AHEAD);
  return {
    min: toLocalDateTimeInputValue(now),
    max: toLocalDateTimeInputValue(max),
  };
}

function getEventDateValidationMessage(startValue: string, endValue: string) {
  if (!startValue || !endValue) return "";

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Please enter a valid start and end date.";
  }

  const now = new Date();
  now.setSeconds(0, 0);
  const max = new Date(now);
  max.setFullYear(max.getFullYear() + MAX_EVENT_YEARS_AHEAD);

  if (start < now) {
    return "Events cannot be saved in the past. Please choose a future start date.";
  }
  if (end <= start) {
    return "The event end time must be after the start time.";
  }
  if (start > max || end > max) {
    return `That date is too far in the future. Please choose a date within the next ${MAX_EVENT_YEARS_AHEAD} years.`;
  }

  return "";
}

function formFromEvent(event: Event): FormState {
  return {
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    start: toLocalDateTimeValue(event.start),
    end: toLocalDateTimeValue(event.end),
    movieId: event.movieId || "",
    priceType: event.priceType || "free",
    pricePence: event.pricePence == null ? "" : String(event.pricePence),
    capacity: event.capacity == null ? "" : String(event.capacity),
  };
}

const emptyForm: FormState = {
  title: "",
  description: "",
  location: "",
  start: "",
  end: "",
  movieId: "",
  priceType: "free",
  pricePence: "",
  capacity: "",
};

export default function EditEventPage() {
  const router = useRouter();
  const eventId = typeof router.query.id === "string" ? router.query.id : "";

  const [adminReady, setAdminReady] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<TmdbSearchHit[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [movieSearchMessage, setMovieSearchMessage] = useState("");
  const [selectedMovieSummary, setSelectedMovieSummary] = useState("");
  const dateBounds = getEventDateBounds();
  const dateError = getEventDateValidationMessage(form.start, form.end);

  useEffect(() => {
    if (!router.isReady || !eventId) return;

    if (!getAdminSession()) {
      void router.replace(`/admin/login?next=/admin/events/${eventId}/edit`);
      return;
    }

    setAdminReady(true);
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const loaded = await getEvent(eventId);
        if (!cancelled) {
          setEvent(loaded);
          setForm(formFromEvent(loaded));
          setMovieQuery("");
          setMovieResults([]);
          setMovieSearchMessage("");
          setSelectedMovieSummary(loaded.movieId ? `Current linked film: TMDb ID ${loaded.movieId}` : "");
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, eventId]);

  function onChange<K extends keyof FormState>(key: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));
  }

  async function handleLogout() {
    clearAdminSession();
    await logoutAdmin();
    await router.push("/admin/login");
  }

  async function onSearchMovies() {
    const query = movieQuery.trim();
    if (!query) {
      setMovieSearchMessage("Enter a film title to search TMDb.");
      return;
    }

    setLoadingMovies(true);
    setMovieSearchMessage("");
    try {
      const { results } = await searchMovies(query);
      setMovieResults(results);
      setMovieSearchMessage(
        results.length === 0
          ? "No matching films found. Try a different title, or use the advanced TMDb ID field."
          : ""
      );
    } catch (err) {
      console.error("Movie search failed", err);
      setMovieResults([]);
      setMovieSearchMessage("Film search is unavailable right now. You can still use the advanced TMDb ID field if needed.");
    } finally {
      setLoadingMovies(false);
    }
  }

  function selectMovie(m: TmdbSearchHit) {
    const year = m.releaseDate ? ` (${m.releaseDate.slice(0, 4)})` : "";
    setForm((current) => ({ ...current, movieId: String(m.id) }));
    setMovieQuery(m.title);
    setSelectedMovieSummary(`${m.title}${year} — TMDb ID ${m.id}`);
    setMovieSearchMessage("");
    setMovieResults([]);
  }

  function updateManualMovieId(value: string) {
    setForm((current) => ({ ...current, movieId: value }));
    setSelectedMovieSummary(value.trim() ? `Manual TMDb ID: ${value.trim()}` : "");
  }

  const valid =
    form.title.trim().length > 0 &&
    form.description.trim().length >= 10 &&
    form.location.trim().length >= 2 &&
    form.start &&
    form.end &&
    !dateError &&
    (form.priceType !== "fixed" || form.pricePence.trim().length > 0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eventId) return;
    setMsg("");

    const currentDateError = getEventDateValidationMessage(form.start, form.end);
    if (currentDateError) {
      setMsg(currentDateError);
      return;
    }

    const payload: UpdateEventInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      start: toIsoFromLocal(form.start),
      end: toIsoFromLocal(form.end),
      movieId: form.movieId.trim() || undefined,
      priceType: form.priceType,
      pricePence: form.priceType === "fixed" ? Number(form.pricePence) : null,
      capacity: form.capacity.trim() ? Number(form.capacity) : null,
    };

    try {
      setSaving(true);
      const saved = await updateEvent(eventId, payload);
      setEvent(saved);
      setForm(formFromEvent(saved));
      setSelectedMovieSummary(saved.movieId ? `Linked film: TMDb ID ${saved.movieId}` : "");
      setMsg("Event updated");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!eventId || !event) return;
    const confirmed = window.confirm(
      `Delete "${event.title}"?\n\nThis will permanently remove the event from FilmHub. This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteEvent(eventId);
      await router.push("/admin/events");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeleting(false);
    }
  }

  if (!adminReady) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-center" aria-busy="true">
        <p className="text-gray-700">Checking admin session…</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Event | FilmHub Admin</title>
        <meta name="description" content="Admin page for editing a FilmHub event." />
      </Head>

      <main className="min-h-screen bg-gray-100 py-10">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin/events" className="text-sm text-gray-600 hover:text-gray-800 hover:underline">
                ← Back to manage events
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Event</h1>
            </div>
            <div className="flex items-center gap-3">
              {event && (
                <Link href={`/events/${event.id}`} className="text-sm text-blue-700 hover:underline">
                  View public page
                </Link>
              )}
              <button type="button" onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-800 hover:underline">
                Logout
              </button>
            </div>
          </div>

          {loading ? (
            <section
              className="rounded-lg border bg-white p-8 text-center shadow-sm"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-purple-100 border-t-purple-700" aria-hidden="true" />
              <p className="font-medium text-gray-800">Loading event editor…</p>
              <p className="mt-1 text-sm text-gray-500">Fetching the selected event details.</p>
            </section>
          ) : error ? (
            <p className="rounded border border-red-200 bg-red-50 p-6 text-red-700">
              Error: {error}
            </p>
          ) : (
            <div className="space-y-6">
              <form onSubmit={onSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm" aria-label="Edit event form">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium">
                    Title
                  </label>
                  <input id="title" className="mt-1 w-full rounded border p-2" value={form.title} onChange={onChange("title")} required />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="mt-1 w-full rounded border p-2"
                    rows={4}
                    value={form.description}
                    onChange={onChange("description")}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-700">Min 10 characters</p>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium">
                    Location
                  </label>
                  <input id="location" className="mt-1 w-full rounded border p-2" value={form.location} onChange={onChange("location")} required />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="start" className="block text-sm font-medium">
                      Start
                    </label>
                    <input
                      id="start"
                      type="datetime-local"
                      className="mt-1 w-full rounded border p-2"
                      value={form.start}
                      onChange={onChange("start")}
                      min={dateBounds.min}
                      max={dateBounds.max}
                      required
                      aria-invalid={!!dateError}
                      aria-describedby={dateError ? "event-date-error" : undefined}
                    />
                    <p className="mt-1 text-xs text-gray-700">Preview: {formatDateTimeShort(toIsoFromLocal(form.start))}</p>
                  </div>

                  <div>
                    <label htmlFor="end" className="block text-sm font-medium">
                      End
                    </label>
                    <input
                      id="end"
                      type="datetime-local"
                      className="mt-1 w-full rounded border p-2"
                      value={form.end}
                      onChange={onChange("end")}
                      min={form.start || dateBounds.min}
                      max={dateBounds.max}
                      required
                      aria-invalid={!!dateError}
                      aria-describedby={dateError ? "event-date-error" : undefined}
                    />
                    <p className="mt-1 text-xs text-gray-700">Preview: {formatDateTimeShort(toIsoFromLocal(form.end))}</p>
                  </div>
                </div>

                {dateError && (
                  <p id="event-date-error" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {dateError}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor="priceType" className="block text-sm font-medium">
                      Price type
                    </label>
                    <select id="priceType" className="mt-1 w-full rounded border p-2" value={form.priceType} onChange={onChange("priceType")}>
                      <option value="free">Free</option>
                      <option value="fixed">Fixed</option>
                      <option value="pay_what_you_feel">Pay what you feel</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pricePence" className="block text-sm font-medium">
                      Price pence
                    </label>
                    <input
                      id="pricePence"
                      type="number"
                      min="1"
                      className="mt-1 w-full rounded border p-2"
                      value={form.pricePence}
                      onChange={onChange("pricePence")}
                      disabled={form.priceType !== "fixed"}
                    />
                  </div>

                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium">
                      Capacity
                    </label>
                    <input id="capacity" type="number" min="1" className="mt-1 w-full rounded border p-2" value={form.capacity} onChange={onChange("capacity")} />
                  </div>
                </div>

                <section className="rounded-lg border border-purple-100 bg-purple-50/40 p-4" aria-labelledby="film-link-heading">
                  <h2 id="film-link-heading" className="text-sm font-semibold text-gray-900">
                    Link a film
                  </h2>
                  <p className="mt-1 text-sm text-gray-700">
                    Search by film title and select the correct result. FilmHub stores the TMDb ID in the background so event cards and detail pages can show the linked poster and film information.
                  </p>

                  <label htmlFor="movieQuery" className="mt-4 block text-sm font-medium">
                    Search for a film by title
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="movieQuery"
                      name="movieQuery"
                      className="flex-grow rounded border p-2"
                      value={movieQuery}
                      onChange={(e) => setMovieQuery(e.target.value)}
                      placeholder="e.g., Inception"
                    />
                    <button
                      type="button"
                      onClick={onSearchMovies}
                      disabled={loadingMovies}
                      className="rounded bg-gray-700 px-3 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                      aria-label="Search films on TMDb"
                    >
                      {loadingMovies ? "Searching…" : "Search"}
                    </button>
                  </div>

                  {movieSearchMessage && (
                    <p className="mt-2 text-sm text-gray-700" role="status">
                      {movieSearchMessage}
                    </p>
                  )}

                  {movieResults.length > 0 && (
                    <ul className="mt-3 max-h-56 overflow-y-auto rounded border bg-white" aria-label="Film search results">
                      {movieResults.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            className="block w-full p-3 text-left hover:bg-purple-50"
                            onClick={() => selectMovie(m)}
                          >
                            <span className="font-medium text-gray-900">{m.title}</span>
                            <span className="ml-2 text-sm text-gray-600">
                              {m.releaseDate ? m.releaseDate.slice(0, 4) : "Year unknown"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {form.movieId && (
                    <p className="mt-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
                      Selected film: {selectedMovieSummary || `TMDb ID ${form.movieId}`}
                    </p>
                  )}

                  <details className="mt-4 rounded border bg-white p-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-800">
                      Advanced: enter TMDb Movie ID manually
                    </summary>
                    <p className="mt-2 text-sm text-gray-600">
                      Most users should use the search box above. Use this field only if you already know the exact TMDb movie ID.
                    </p>
                    <input
                      id="movieId"
                      name="movieId"
                      className="mt-2 w-full rounded border p-2"
                      value={form.movieId}
                      onChange={(e) => updateManualMovieId(e.target.value)}
                      placeholder="e.g., 27205 for Inception"
                    />
                  </details>
                </section>

                <button
                  type="submit"
                  disabled={!valid || saving}
                  className={`rounded px-4 py-2 text-white ${valid && !saving ? "bg-black hover:bg-gray-800" : "cursor-not-allowed bg-gray-400"}`}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>

                {msg && <p className="text-sm" role="status">{msg}</p>}
              </form>

              <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm" aria-label="Danger Zone">
                <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
                <p className="mt-2 text-sm text-gray-700">
                  Delete this event only if it should be permanently removed. This action cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="mt-4 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {deleting ? "Deleting…" : "Delete event"}
                </button>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
