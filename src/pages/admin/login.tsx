import { FormEvent, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { loginAdmin } from "@/lib/api";
import { getAdminSession, saveAdminSession } from "@/lib/adminSession";

function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/admin") ? value : "/admin/events";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (getAdminSession()) {
      void router.replace(safeNext(router.query.next));
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!passcode.trim()) {
      setMessage("Please enter the admin passcode.");
      return;
    }

    try {
      setSubmitting(true);
      const session = await loginAdmin(passcode);
      saveAdminSession(session);
      await router.push(safeNext(router.query.next));
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login | FilmHub</title>
        <meta name="description" content="FilmHub admin login." />
      </Head>

      <main className="min-h-screen bg-gray-100 px-6 py-12">
        <section className="mx-auto max-w-md rounded-lg border bg-white p-6 shadow-sm">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 hover:underline">
            ← Back to events
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-700">
            Log in once to create, edit, and delete events during this admin session.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-label="Admin login form">
            <div>
              <label htmlFor="admin-passcode" className="block text-sm font-medium text-gray-900">
                Admin passcode
              </label>
              <input
                id="admin-passcode"
                type="password"
                className="mt-1 w-full rounded border p-2"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoComplete="current-password"
                required
              />
              <p className="mt-1 text-xs text-gray-600">
                The passcode is checked by the backend and is not stored in the browser.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-purple-300"
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>

            {message && (
              <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                {message}
              </p>
            )}
          </form>
        </section>
      </main>
    </>
  );
}
