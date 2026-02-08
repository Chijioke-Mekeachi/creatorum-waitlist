"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_WAITLIST_API_BASE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

const TOKEN_KEY = "creat_admin_token";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => !loading && email.trim().length > 0 && password.length > 0, [email, loading, password.length]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/admin/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => null)) as null | { token?: unknown; error?: unknown };
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : `Login failed (${res.status}).`);
        return;
      }
      if (!json || typeof json.token !== "string") {
        setError("Unexpected response from server.");
        return;
      }
      localStorage.setItem(TOKEN_KEY, json.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adminMain">
      <div className="adminAuthCard">
        <div className="adminAuthHeader">
          <div className="adminKicker">Creatorum</div>
          <h1 className="adminTitle">Admin login</h1>
          <div className="adminMuted">Sign in to view waitlist data and insights.</div>
        </div>

        <form onSubmit={onSubmit} className="adminForm">
          <div>
            <label className="adminLabel" htmlFor="email">
              Email
            </label>
            <input id="email" className="adminInput" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>

          <div>
            <label className="adminLabel" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="adminInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="adminError" role="alert">
              {error}
            </div>
          ) : null}

          <button className="adminBtn adminBtnPrimary" type="submit" disabled={!canSubmit}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="adminFooterRow">
            <span className="adminMuted">Need an admin account?</span>{" "}
            <Link className="adminLink" href="/admin/signup">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

