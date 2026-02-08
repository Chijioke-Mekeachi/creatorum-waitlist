"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

export default function Header({ onJoinWaitlist }: { onJoinWaitlist: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="header">
      <div className="container">
        <div className="headerInner">
          <Link className="brand" href="/" aria-label="Creatorum home">
            Creatorum
          </Link>

          <nav className="nav navDesktop" aria-label="Main">
            <Link className="navLink" href="/">
              Home
            </Link>
            <button className="btn btnPrimary" type="button" onClick={onJoinWaitlist}>
              Join Waitlist
            </button>
          </nav>

          <div className="navMobile" aria-label="Mobile menu">
            <button
              className="hamburgerBtn"
              type="button"
              aria-haspopup="menu"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="hamburgerIcon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="srOnly">Menu</span>
            </button>

            {mobileOpen ? (
              <>
                <button className="menuOverlay" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
                <div id={menuId} className="mobileDropdown" role="menu" aria-label="Main">
                  <Link className="mobileItem" href="/" role="menuitem" onClick={() => setMobileOpen(false)}>
                    Home
                  </Link>
                  <button
                    className="mobileItem mobileItemPrimary"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMobileOpen(false);
                      onJoinWaitlist();
                    }}
                  >
                    Join Waitlist
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
