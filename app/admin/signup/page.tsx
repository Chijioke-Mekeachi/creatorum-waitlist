"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_WAITLIST_API_BASE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

const TOKEN_KEY = "creat_admin_token";

export default function AdminSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => !loading && email.trim().length > 0 && password.length >= 8 && inviteCode.trim().length > 0, [
    email,
    inviteCode,
    loading,
    password.length,
  ]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${apiBase()}/admin/signup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, inviteCode }),
      });
      const json = (await res.json().catch(() => null)) as null | { error?: unknown };
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : `Signup failed (${res.status}).`);
        return;
      }

      setSuccess("Admin created. Signing you in…");

      const loginRes = await fetch(`${apiBase()}/admin/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginJson = (await loginRes.json().catch(() => null)) as null | { token?: unknown; error?: unknown };
      if (!loginRes.ok || !loginJson || typeof loginJson.token !== "string") {
        router.push("/admin/login");
        return;
      }

      localStorage.setItem(TOKEN_KEY, loginJson.token);
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
          <h1 className="adminTitle">Admin sign up</h1>
          <div className="adminMuted">Requires an invite code (hard-coded in the backend).</div>
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
              Password (min 8 chars)
            </label>
            <input
              id="password"
              className="adminInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="adminLabel" htmlFor="invite">
              Invite code
            </label>
            <input id="invite" className="adminInput" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
          </div>

          {error ? (
            <div className="adminError" role="alert">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="adminSuccess" role="status">
              {success}
            </div>
          ) : null}

          <button className="adminBtn adminBtnPrimary" type="submit" disabled={!canSubmit}>
            {loading ? "Creating..." : "Create admin"}
          </button>

          <div className="adminFooterRow">
            <span className="adminMuted">Already have access?</span>{" "}
            <Link className="adminLink" href="/admin/login">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

