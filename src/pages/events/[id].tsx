// src/pages/events/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState, FormEvent } from "react";
import {
  getEvent,
  createSignup,
  type Event,
  fetchMovie,
  type TmdbMovie,
  tmdbPosterUrl,
} from "@/lib/api";
import { googleCalUrl } from "@/lib/calendar";
import { formatDateTime } from "@/lib/dates";
import Custom404 from "../404";

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = (router.query as { id?: string }) || {};

  const [event, setEvent] = useState<Event | null>(null);
  const [notFound, setNotFound] = useState(false);

  // TMDb movie info
  const [movie, setMovie] = useState<TmdbMovie | null>(null);
  const [movieErr, setMovieErr] = useState<string>("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = await getEvent(id);
        if (!d) setNotFound(true);
        else setEvent(d);
      } catch {
        setNotFound(true);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!event?.movieId) return;
    (async () => {
      try {
        const m = await fetchMovie(event.movieId as string);
        setMovie(m);
      } catch (err: any) {
        setMovie(null);
        setMovieErr(err?.message || "Failed to load film info");
      }
    })();
  }, [event?.movieId]);

  if (notFound) return <Custom404 />;
  if (!event) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <section
          className="rounded-lg border bg-white p-8 text-center shadow-sm"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-purple-100 border-t-purple-700" aria-hidden="true" />
          <p className="font-medium text-gray-800">Loading event details…</p>
          <p className="mt-1 text-sm text-gray-500">Preparing the event page.</p>
        </section>
      </main>
    );
  }

  const e = event!;

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setMsg("");

    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await createSignup({ eventId: e.id, name, email });
      setMsg("Thanks for signing up!");
      setName("");
      setEmail("");
      setErrors({});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calendar URLs with safe fallbacks
  const startDate = e.start ? new Date(e.start) : new Date();
  const endDate = e.end
    ? new Date(e.end)
    : new Date(startDate.getTime() + 60 * 60 * 1000);

  const googleUrl = googleCalUrl({
    title: e.title,
    details: e.description ?? "",
    location: e.location ?? "",
    start: startDate,
    end: endDate,
  });
  const icsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${e.id}/ics`;

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">{e.title}</h1>
        {e.description && <p>{e.description}</p>}
        <p>
          <strong>When:</strong> {formatDateTime(e.start)} –{" "}
          {formatDateTime(e.end)}
        </p>
        {e.location && (
          <p>
            <strong>Where:</strong> {e.location}
          </p>
        )}
      </section>

      {/* Film info */}
      {e.movieId && (
        <section className="border-t pt-4">
          <h2 className="text-xl font-semibold">About the Film</h2>
          {movieErr && <p className="text-sm text-red-600 mt-1">{movieErr}</p>}
          {movie ? (
            <div className="mt-3 flex gap-4">
              {movie.posterPath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tmdbPosterUrl(movie.posterPath) ?? ""}
                  alt={movie.title}
                  className="w-32 rounded"
                  loading="lazy"
                />
              )}
              <div>
                <p className="font-medium">
                  {movie.title}{" "}
                  {movie.releaseDate && (
                    <span className="text-gray-600">
                      ({movie.releaseDate.slice(0, 4)})
                    </span>
                  )}
                </p>
                {movie.overview && (
                  <p className="mt-1 text-sm">{movie.overview}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Data & images © TMDb —{" "}
                  <a
                    className="underline"
                    href="https://www.themoviedb.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Powered by TMDb
                  </a>
                </p>
              </div>
            </div>
          ) : !movieErr ? (
            <p className="text-sm text-gray-600 mt-2">
              Loading film details…
            </p>
          ) : null}
        </section>
      )}

      {/* Signup form */}
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Event signup form"
        className="space-y-3 border p-4 rounded"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Your Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="border p-2 w-full"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            autoComplete="name"
          />
          {errors.name && (
            <p id="name-error" className="text-red-500 text-sm">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="border p-2 w-full"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 text-sm">
              {errors.email}
            </p>
          )}
        </div>

        <button
          type="submit"
          aria-label="Sign up for this event"
          className="px-3 py-2 bg-black text-white rounded disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting…" : "Sign Up"}
        </button>

        {msg && !errors.name && !errors.email && (
          <p className="text-sm mt-2" role="status">
            {msg}
          </p>
        )}
      </form>

      {msg === "Thanks for signing up!" && (
        <div className="space-y-2" aria-label="Calendar options">
          <p className="font-medium">Add this event to your calendar:</p>
          <div className="flex gap-3">
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              role="link"
              aria-label={`Add ${e.title} to your Google Calendar`}
              className="px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
            >
              Google Calendar
            </a>
            <a
              href={icsUrl}
              role="link"
              aria-label={`Download ${e.title} as an iCalendar (.ics) file`}
              className="px-3 py-2 rounded border border-purple-600 text-purple-700 hover:bg-purple-50"
            >
              Download .ics
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
