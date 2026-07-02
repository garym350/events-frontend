import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  createEvent,
  type CreateEventInput,
  searchMovies,
  type TmdbSearchHit,
  logoutAdmin,
} from "@/lib/api";
import { clearAdminSession, getAdminSession } from "@/lib/adminSession";
import { formatDateTimeShort } from "@/lib/dates";

type FormState = {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  movieId?: string;
};

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
    return "Events cannot be created in the past. Please choose a future start date.";
  }
  if (end <= start) {
    return "The event end time must be after the start time.";
  }
  if (start > max || end > max) {
    return `That date is too far in the future. Please choose a date within the next ${MAX_EVENT_YEARS_AHEAD} years.`;
  }

  return "";
}

export default function Admin() {
  const router = useRouter();
  const [adminReady, setAdminReady] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    location: "",
    start: "",
    end: "",
    movieId: "",
  });
  const [msg, setMsg] = useState<string>("");

  // Film search state. The selected TMDb ID is stored in form.movieId.
  const [movieQuery, setMovieQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchHit[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [movieSearchMessage, setMovieSearchMessage] = useState("");
  const [selectedMovieSummary, setSelectedMovieSummary] = useState("");

  useEffect(() => {
    if (!getAdminSession()) {
      void router.replace("/admin/login?next=/admin");
      return;
    }
    setAdminReady(true);
  }, [router]);

  function onChange<K extends keyof FormState>(key: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleLogout() {
    clearAdminSession();
    await logoutAdmin();
    await router.push("/admin/login");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg("");

    const currentDateError = getEventDateValidationMessage(form.start, form.end);
    if (currentDateError) {
      setMsg(currentDateError);
      return;
    }

    const payload: CreateEventInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      start: form.start,
      end: form.end,
      movieId: form.movieId?.trim() || undefined,
    };

    try {
      await createEvent(payload);
      setMsg("Event created");
      setForm({
        title: "",
        description: "",
        location: "",
        start: "",
        end: "",
        movieId: "",
      });
      setMovieQuery("");
      setResults([]);
      setMovieSearchMessage("");
      setSelectedMovieSummary("");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to create event");
    }
  }

  // Film search is the primary way to link a movie to an event.
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
      setResults(results);
      setMovieSearchMessage(
        results.length === 0
          ? "No matching films found. Try a different title, or use the advanced TMDb ID field."
          : ""
      );
    } catch (err) {
      console.error("Movie search failed", err);
      setResults([]);
      setMovieSearchMessage("Film search is unavailable right now. You can still use the advanced TMDb ID field if needed.");
    } finally {
      setLoadingMovies(false);
    }
  }

  function selectMovie(m: TmdbSearchHit) {
    const year = m.releaseDate ? ` (${m.releaseDate.slice(0, 4)})` : "";
    setForm((f) => ({ ...f, movieId: String(m.id) }));
    setMovieQuery(m.title);
    setSelectedMovieSummary(`${m.title}${year} — TMDb ID ${m.id}`);
    setMovieSearchMessage("");
    setResults([]);
  }

  function updateManualMovieId(value: string) {
    setForm((f) => ({ ...f, movieId: value }));
    setSelectedMovieSummary(value.trim() ? `Manual TMDb ID: ${value.trim()}` : "");
  }

  // Preview helpers
  function toIsoFromLocal(dt: string) {
    if (!dt) return "";
    const d = new Date(dt);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const previewStart = formatDateTimeShort(toIsoFromLocal(form.start));
  const previewEnd = formatDateTimeShort(toIsoFromLocal(form.end));
  const dateBounds = getEventDateBounds();
  const dateError = getEventDateValidationMessage(form.start, form.end);

  // Simple frontend validation
  const valid =
    form.title.trim().length > 0 &&
    form.description.trim().length >= 10 &&
    form.location.trim().length >= 2 &&
    form.start &&
    form.end &&
    !dateError;

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
        <title>Create Event | FilmHub</title>
        <meta name="description" content="Admin page for creating new events." />
      </Head>

      <main className="max-w-xl mx-auto p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
            aria-label="Back to events page"
          >
            ← Back to events
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/events"
              className="text-sm text-purple-700 hover:text-purple-900 hover:underline"
              aria-label="Go to admin event management"
            >
              Manage events
            </Link>
            <button type="button" onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-800 hover:underline">
              Logout
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4">Create Event</h1>
        <p className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          You are logged in for this admin session. Create, edit, and delete actions use your session token automatically.
        </p>

        <form onSubmit={onSubmit} className="space-y-4" aria-label="Create event form">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              name="title"
              className="border p-2 w-full"
              value={form.title}
              onChange={onChange("title")}
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="border p-2 w-full"
              rows={4}
              value={form.description}
              onChange={onChange("description")}
              required
              aria-required="true"
              aria-describedby="desc-help"
            />
            <p id="desc-help" className="text-xs text-gray-700">
              Min 10 characters
            </p>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium">
              Location
            </label>
            <input
              id="location"
              name="location"
              className="border p-2 w-full"
              value={form.location}
              onChange={onChange("location")}
              required
              aria-required="true"
              aria-describedby="loc-help"
            />
            <p id="loc-help" className="text-xs text-gray-700">
              Venue name or online location
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start" className="block text-sm font-medium">
                Start
              </label>
              <input
                id="start"
                name="start"
                type="datetime-local"
                className="border p-2 w-full"
                value={form.start}
                onChange={onChange("start")}
                min={dateBounds.min}
                max={dateBounds.max}
                required
                aria-required="true"
                aria-invalid={!!dateError}
                aria-describedby={dateError ? "event-date-error" : undefined}
              />
              <p className="text-xs text-gray-700">Preview: {previewStart}</p>
            </div>
            <div>
              <label htmlFor="end" className="block text-sm font-medium">
                End
              </label>
              <input
                id="end"
                name="end"
                type="datetime-local"
                className="border p-2 w-full"
                value={form.end}
                onChange={onChange("end")}
                min={form.start || dateBounds.min}
                max={dateBounds.max}
                required
                aria-required="true"
                aria-invalid={!!dateError}
                aria-describedby={dateError ? "event-date-error" : undefined}
              />
              <p className="text-xs text-gray-700">Preview: {previewEnd}</p>
            </div>
          </div>

          {dateError && (
            <p id="event-date-error" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {dateError}
            </p>
          )}

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

            {results.length > 0 && (
              <ul className="mt-3 max-h-56 overflow-y-auto rounded border bg-white" aria-label="Film search results">
                {results.map((m) => (
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
            disabled={!valid}
            className={`px-3 py-2 rounded text-white ${
              valid
                ? "bg-black hover:bg-gray-800"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            aria-label="Create event"
          >
            Create Event
          </button>

          {msg && (
            <p className="text-sm mt-2" role="status">
              {msg}
            </p>
          )}
        </form>
      </main>
    </>
  );
}
