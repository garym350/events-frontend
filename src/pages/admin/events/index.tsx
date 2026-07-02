import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { deleteEvent, listEvents, logoutAdmin, type Event } from "@/lib/api";
import { clearAdminSession, getAdminSession } from "@/lib/adminSession";
import { formatDateTimeShort } from "@/lib/dates";

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminReady, setAdminReady] = useState(false);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const data = await listEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    if (!getAdminSession()) {
      void router.replace("/admin/login?next=/admin/events");
      return () => {
        cancelled = true;
      };
    }

    setAdminReady(true);

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listEvents();
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    clearAdminSession();
    await logoutAdmin();
    await router.push("/admin/login");
  }

  async function handleDelete(event: Event) {
    const confirmed = window.confirm(
      `Delete "${event.title}"?\n\nThis will permanently remove the event from FilmHub. This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(event.id);
      await deleteEvent(event.id);
      setEvents((prev) => prev.filter((item) => item.id !== event.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete event failed");
    } finally {
      setDeletingId(null);
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
        <title>Manage Events | FilmHub Admin</title>
        <meta name="description" content="Admin page for managing FilmHub events." />
      </Head>

      <main className="min-h-screen bg-gray-100 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                aria-label="Back to public events page"
              >
                ← Back to events
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Manage Events</h1>
              <p className="mt-1 text-sm text-gray-600">
                Admin-only event editing and deletion controls.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadEvents}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Refresh
              </button>
              <Link
                href="/admin"
                className="rounded bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800"
                aria-label="Create new event"
              >
                Create Event
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
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
              <p className="font-medium text-gray-800">Loading admin event list…</p>
              <p className="mt-1 text-sm text-gray-500">Fetching the latest event records.</p>
            </section>
          ) : error ? (
            <p className="rounded border border-red-200 bg-red-50 p-6 text-red-700">
              Error: {error}
            </p>
          ) : events.length === 0 ? (
            <div className="rounded bg-white p-6 text-center text-gray-600">
              <p>No events found.</p>
              <Link href="/admin" className="mt-3 inline-block text-purple-700 hover:underline">
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Event
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Location
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        {event.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{event.description}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-top text-sm text-gray-700">
                        {event.start ? formatDateTimeShort(event.start) : "Date TBA"}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        {event.location || "TBA"}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-3 text-sm">
                          <Link href={`/events/${event.id}`} className="text-blue-700 hover:underline">
                            View
                          </Link>
                          <Link href={`/admin/events/${event.id}/edit`} className="text-purple-700 hover:underline">
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(event)}
                            disabled={deletingId === event.id}
                            className="text-red-700 hover:underline disabled:cursor-not-allowed disabled:text-red-300"
                          >
                            {deletingId === event.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
