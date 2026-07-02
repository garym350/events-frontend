import Head from "next/head";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <>
      <Head>
        <title>Products | FilmHub</title>
        <meta name="description" content="FilmHub event packages and product options." />
      </Head>
      <main className="min-h-screen bg-gray-100 px-6 py-12">
        <section className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-purple-700">FilmHub</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Products & Packages</h1>
          <p className="mt-4 text-gray-700">
            Product and package options will appear here as the platform grows. This page keeps the public navigation complete while the MVP focuses on event discovery, film-linked events, and signup workflows.
          </p>
          <div className="mt-6 rounded border border-dashed border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
            Next phase: show ticket bundles, membership options, gift vouchers, or organiser packages.
          </div>
          <Link href="/" className="mt-6 inline-block font-medium text-purple-700 hover:underline">
            ← Back to events
          </Link>
        </section>
      </main>
    </>
  );
}
