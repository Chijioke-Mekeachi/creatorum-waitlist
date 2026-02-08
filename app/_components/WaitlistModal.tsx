"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Role = "Creator" | "Brand" | "Seller" | "Just Joining";
type Goal =
  | "find brand deals"
  | "growing as a creator"
  | "discovering creators"
  | "managing collaboration and deals";

const roles: Role[] = ["Creator", "Brand", "Seller", "Just Joining"];
const goals: { value: Goal; label: string }[] = [
  { value: "find brand deals", label: "Find brand deals" },
  { value: "growing as a creator", label: "Growing as a creator" },
  { value: "discovering creators", label: "Discovering creators" },
  { value: "managing collaboration and deals", label: "Managing collaboration and deals" }
];

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_WAITLIST_API_BASE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

async function safeJson(res: Response): Promise<unknown | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function WaitlistModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Creator");
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>(["find brand deals"]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return fullName.trim().length > 0 && email.trim().length > 0 && selectedGoals.length > 0 && !submitting;
  }, [email, fullName, selectedGoals.length, submitting]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(null);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${apiBase()}/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          role,
          goals: selectedGoals
        })
      });

      if (!res.ok) {
        const body = await safeJson(res);
        const message =
          body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string"
            ? (body as { error: string }).error
            : `Request failed (${res.status}).`;
        setError(message);
        return;
      }

      setSuccess("You’re on the waitlist. We’ll reach out soon.");
      setFullName("");
      setEmail("");
      setRole("Creator");
      setSelectedGoals(["find brand deals"]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleGoal(goal: Goal) {
    setSelectedGoals((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal);
      return [...prev, goal];
    });
  }

  if (!open) return null;

  return (
    <div className="modalOverlay" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Join waitlist"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div>
            <h2 className="modalTitle">Join the waitlist</h2>
            <div className="help">Tell us who you are and what you want to do on Creatorum.</div>
          </div>
          <button className="btn btnGhost" type="button" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="modalBody">
          <div className="fieldGrid">
            <div>
              <label className="label" htmlFor="fullName">
                Full name
              </label>
              <input
                ref={firstInputRef}
                id="fullName"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="role">
                Role
              </label>
              <select id="role" className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="label">Goals (pick at least one)</div>
              <div className="checkboxGrid">
                {goals.map((g) => (
                  <label key={g.value} className="checkboxRow">
                    <input
                      type="checkbox"
                      checked={selectedGoals.includes(g.value)}
                      onChange={() => toggleGoal(g.value)}
                    />
                    <span>{g.label}</span>
                  </label>
                ))}
              </div>
              <div className="help">Your selection maps to the backend’s allowed goals.</div>
            </div>
          </div>

          {error ? <div className="error" role="alert">{error}</div> : null}
          {success ? <div className="success" role="status">{success}</div> : null}

          <div className="modalFooter">
            <button className="btn btnGhost" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="btn btnPrimary" type="submit" disabled={!canSubmit}>
              {submitting ? "Joining..." : "Join Waitlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
