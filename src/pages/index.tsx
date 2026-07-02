// src/pages/index.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { listEvents, type Event } from "@/lib/api";
import { formatDateTimeShort } from "@/lib/dates";
import MoviePreview from "@/components/MoviePreview";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listEvents();
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load events";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Upcoming Events | FilmHub</title>
        <meta
          name="description"
          content="Browse and sign up for upcoming FilmHub community events."
        />
      </Head>

      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1
            className="text-4xl font-bold text-purple-700 mb-8 text-center"
            aria-label="Upcoming Events"
          >
            Upcoming Events
          </h1>

          {loading ? (
            <section
              className="rounded-lg border border-purple-100 bg-white p-6 shadow-sm"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="mb-4 flex items-center justify-center gap-3 text-purple-800">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" aria-hidden="true" />
                <span className="font-medium">Loading upcoming events…</span>
              </div>
              <div className="space-y-4" aria-hidden="true">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="animate-pulse rounded-lg border bg-gray-50 p-5">
                    <div className="mb-3 h-5 w-2/3 rounded bg-gray-200" />
                    <div className="mb-4 h-4 w-1/2 rounded bg-gray-200" />
                    <div className="h-4 w-28 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </section>
          ) : error ? (
            <p className="text-center text-red-700">Error: {error}</p>
          ) : events.length > 0 ? (
            <ul className="space-y-6" aria-label="Event list">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    {/* Left: Event info */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        {event.title}
                      </h2>
                      <p className="text-gray-700 mb-3">
                        {event.start
                          ? formatDateTimeShort(event.start)
                          : "Date TBA"}{" "}
                        — {event.location || "TBA"}
                      </p>

                      <div className="flex items-center gap-4">
                        <Link
                          href={`/events/${event.id}`}
                          className="inline-block text-blue-700 font-medium hover:underline"
                          aria-label={`View details for ${event.title}`}
                        >
                          View details →
                        </Link>
                      </div>
                    </div>

                    {/* Right: Movie preview or placeholder */}
                    {event.movieId ? (
                      <MoviePreview movieId={event.movieId} />
                    ) : (
                      <aside className="ml-4 shrink-0 rounded-lg border bg-gray-50 p-3 shadow-inner md:w-[220px] flex items-center justify-center text-sm text-gray-500">
                        No film allocated
                      </aside>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-600">No events found.</p>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/admin/events"
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
              aria-label="Go to admin event management page"
            >
              Admin: Manage Events
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
