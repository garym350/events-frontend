import Head from "next/head";
import Link from "next/link";

export default function MyEventsPage() {
  return (
    <>
      <Head>
        <title>My Events | FilmHub</title>
        <meta name="description" content="FilmHub attendee event area." />
      </Head>
      <main className="min-h-screen bg-gray-100 px-6 py-12">
        <section className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-purple-700">Attendee area</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">My Events</h1>
          <p className="mt-4 text-gray-700">
            Attendee bookings and saved events will appear here once account-based attendee access is added. For this MVP, signups are handled from each public event page.
          </p>
          <div className="mt-6 rounded border border-dashed border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
            Next phase: attendee login, booking history, calendar links, and cancellation options.
          </div>
          <Link href="/" className="mt-6 inline-block font-medium text-purple-700 hover:underline">
            ← Browse events
          </Link>
        </section>
      </main>
    </>
  );
}
