"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Role = "Creator" | "Brand" | "Seller" | "Just Joining";
type Goal =
  | "find brand deals"
  | "growing as a creator"
  | "discovering creators"
  | "managing collaboration and deals";

type WaitlistEntry = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  role: Role;
  goals: Goal[];
};

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_WAITLIST_API_BASE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

const TOKEN_KEY = "creat_admin_token";

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function lastNDaysKeys(n: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}

function Sparkline({ points }: { points: number[] }) {
  const w = 280;
  const h = 80;
  const max = Math.max(1, ...points);
  const min = 0;
  const step = points.length <= 1 ? w : w / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="adminSpark" role="img" aria-label="Signups sparkline">
      <path d={d} fill="none" stroke="url(#adminGrad)" strokeWidth="3.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="adminGrad" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--g0)" />
          <stop offset="1" stopColor="var(--g1)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max <= 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="adminBarRow">
      <div className="adminBarLabel">{label}</div>
      <div className="adminBarTrack" aria-hidden="true">
        <div className="adminBarFill" style={{ width: `${width}%` }} />
      </div>
      <div className="adminBarValue">{value}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [count, setCount] = useState<number | null>(null);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const meRes = await fetch(`${apiBase()}/admin/me`, { headers: { authorization: `Bearer ${token}` } });
        const meJson = (await meRes.json().catch(() => null)) as null | { admin?: { email?: unknown } ; error?: unknown };
        if (!meRes.ok) {
          localStorage.removeItem(TOKEN_KEY);
          router.push("/admin/login");
          return;
        }
        const email = meJson?.admin?.email;
        if (typeof email === "string") setAdminEmail(email);

        const [countRes, listRes] = await Promise.all([
          fetch(`${apiBase()}/admin/waitlist/count`, { headers: { authorization: `Bearer ${token}` } }),
          fetch(`${apiBase()}/admin/waitlist?limit=200&offset=0`, { headers: { authorization: `Bearer ${token}` } }),
        ]);

        const countJson = (await countRes.json().catch(() => null)) as null | { count?: unknown; error?: unknown };
        const listJson = (await listRes.json().catch(() => null)) as null | { entries?: unknown; error?: unknown; limit?: unknown; offset?: unknown };

        if (!countRes.ok) throw new Error(typeof countJson?.error === "string" ? countJson.error : `Count failed (${countRes.status}).`);
        if (!listRes.ok) throw new Error(typeof listJson?.error === "string" ? listJson.error : `Load failed (${listRes.status}).`);

        const nextCount = typeof countJson?.count === "number" ? countJson.count : null;
        const nextEntries = Array.isArray(listJson?.entries) ? (listJson?.entries as WaitlistEntry[]) : [];

        if (!cancelled) {
          setCount(nextCount);
          setEntries(nextEntries);
          setOffset(nextEntries.length);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.email.toLowerCase().includes(q) || e.full_name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
  }, [entries, query]);

  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.role, (counts.get(e.role) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const goalCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) for (const g of e.goals ?? []) counts.set(g, (counts.get(g) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [entries]);

  const dailySeries = useMemo(() => {
    const keys = lastNDaysKeys(14);
    const map = new Map<string, number>(keys.map((k) => [k, 0]));
    for (const e of entries) {
      const d = new Date(e.created_at);
      if (Number.isNaN(d.getTime())) continue;
      const k = dayKey(d);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return keys.map((k) => map.get(k) ?? 0);
  }, [entries]);

  const avgGoals = useMemo(() => {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, e) => sum + (Array.isArray(e.goals) ? e.goals.length : 0), 0);
    return total / entries.length;
  }, [entries]);

  const avgPerDay7 = useMemo(() => {
    const last7 = dailySeries.slice(-7);
    const sum = last7.reduce((a, b) => a + b, 0);
    return sum / 7;
  }, [dailySeries]);

  const maxRole = useMemo(() => Math.max(0, ...roleCounts.map(([, v]) => v)), [roleCounts]);
  const maxGoal = useMemo(() => Math.max(0, ...goalCounts.map(([, v]) => v)), [goalCounts]);

  async function loadMore() {
    if (!token) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/admin/waitlist?limit=200&offset=${offset}`, { headers: { authorization: `Bearer ${token}` } });
      const json = (await res.json().catch(() => null)) as null | { entries?: unknown; error?: unknown };
      if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : `Load failed (${res.status}).`);
      const next = Array.isArray(json?.entries) ? (json?.entries as WaitlistEntry[]) : [];
      setEntries((prev) => [...prev, ...next]);
      setOffset((prev) => prev + next.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more.");
    } finally {
      setLoadingMore(false);
    }
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    router.push("/admin/login");
  }

  if (!token) {
    return (
      <main className="adminMain">
        <div className="adminAuthCard">
          <div className="adminAuthHeader">
            <div className="adminKicker">Creatorum</div>
            <h1 className="adminTitle">Admin</h1>
            <div className="adminMuted">Please log in to continue.</div>
          </div>
          <button className="adminBtn adminBtnPrimary" type="button" onClick={() => router.push("/admin/login")}>
            Go to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="adminDashboard">
      <header className="adminTopBar">
        <div className="adminTopLeft">
          <div className="adminBrand">
            <span className="adminBrandDot" aria-hidden="true" />
            Creatorum <span className="adminBrandSub">Admin</span>
          </div>
          <div className="adminMuted adminSmall">{adminEmail ? `Signed in as ${adminEmail}` : " "}</div>
        </div>
        <div className="adminTopRight">
          <button className="adminBtn adminBtnGhost" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="adminGrid">
        <div className="adminCard adminCardSpan2">
          <div className="adminCardHeader">
            <div>
              <div className="adminCardTitle">Waitlist momentum</div>
              <div className="adminMuted adminSmall">Daily signups (last 14 days, from loaded rows)</div>
            </div>
            <div className="adminPill">
              Loaded <strong>{entries.length}</strong> {count != null ? `of ${count}` : ""}
            </div>
          </div>
          <div className="adminCardBody adminRow">
            <Sparkline points={dailySeries} />
            <div className="adminKeyMetrics">
              <div className="adminMetric">
                <div className="adminMetricLabel">Total signups</div>
                <div className="adminMetricValue">{count ?? "—"}</div>
              </div>
              <div className="adminMetric">
                <div className="adminMetricLabel">Creators (loaded)</div>
                <div className="adminMetricValue">{roleCounts.find(([r]) => r === "Creator")?.[1] ?? 0}</div>
              </div>
              <div className="adminMetric">
                <div className="adminMetricLabel">Brands (loaded)</div>
                <div className="adminMetricValue">{roleCounts.find(([r]) => r === "Brand")?.[1] ?? 0}</div>
              </div>
              <div className="adminMetric">
                <div className="adminMetricLabel">Avg goals (loaded)</div>
                <div className="adminMetricValue">{avgGoals.toFixed(1)}</div>
              </div>
              <div className="adminMetric">
                <div className="adminMetricLabel">Avg/day (7d loaded)</div>
                <div className="adminMetricValue">{avgPerDay7.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="adminCard">
          <div className="adminCardHeader">
            <div>
              <div className="adminCardTitle">Role mix</div>
              <div className="adminMuted adminSmall">Who is joining</div>
            </div>
          </div>
          <div className="adminCardBody">
            {roleCounts.length === 0 ? <div className="adminMuted">No data yet.</div> : null}
            {roleCounts.map(([r, v]) => (
              <BarRow key={r} label={r} value={v} max={maxRole} />
            ))}
          </div>
        </div>

        <div className="adminCard">
          <div className="adminCardHeader">
            <div>
              <div className="adminCardTitle">Top goals</div>
              <div className="adminMuted adminSmall">What they want</div>
            </div>
          </div>
          <div className="adminCardBody">
            {goalCounts.length === 0 ? <div className="adminMuted">No data yet.</div> : null}
            {goalCounts.map(([g, v]) => (
              <BarRow key={g} label={g} value={v} max={maxGoal} />
            ))}
          </div>
        </div>
      </section>

      <section className="adminTableSection">
        <div className="adminTableHeader">
          <div>
            <div className="adminCardTitle">Waitlist entries</div>
            <div className="adminMuted adminSmall">Name, email, role, goals</div>
          </div>
          <div className="adminTableActions">
            <input
              className="adminInput adminInputSmall"
              placeholder="Search name/email/role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="adminBtn adminBtnPrimary" type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="adminError" role="alert">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="adminCard adminCardPlain">
            <div className="adminMuted">Loading dashboard…</div>
          </div>
        ) : (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Goals</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>{e.full_name}</td>
                    <td className="adminMono">{e.email}</td>
                    <td>{e.role}</td>
                    <td>{(e.goals ?? []).join(", ")}</td>
                    <td className="adminSmall">{formatDate(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="adminCardsMobile">
              {filtered.map((e) => (
                <div key={e.id} className="adminEntryCard">
                  <div className="adminEntryTop">
                    <div className="adminEntryName">{e.full_name}</div>
                    <div className="adminPill adminPillSmall">{e.role}</div>
                  </div>
                  <div className="adminEntryEmail adminMono">{e.email}</div>
                  <div className="adminEntryGoals">{(e.goals ?? []).join(", ")}</div>
                  <div className="adminMuted adminSmall">{formatDate(e.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
