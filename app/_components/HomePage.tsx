"use client";

import { useMemo, useState } from "react";
import Header from "./Header";
import WaitlistModal from "./WaitlistModal";

const HERO_COPY = `The Operating System For Modern Creators.

Creatorum is a creator-centric platform that helps you turn your content and audience into income, through product reselling, brand deals, and clear performance insights, all from one place.`;

export default function HomePage() {
  const [open, setOpen] = useState(false);

  const lines = useMemo(() => HERO_COPY.split("\n").filter((l) => l.trim().length > 0), []);

  return (
    <div className="homeShell">
      <Header onJoinWaitlist={() => setOpen(true)} />

      <main className="main">
        <div className="container">
          <section className="hero" aria-label="Creatorum home">
            <h1 className="w-full text-[2px]">{lines[0]}</h1>
            <p className="subcopy">{lines.slice(1).join(" ")}</p>

            <div className="heroCard">
              <div className="heroImageWrap">
                <img className="heroImage" src="/hero.svg" alt="Creatorum dashboard preview illustration" />
              </div>
              <div className="ctaRow">
                <button className="btn btnPrimary" type="button" onClick={() => setOpen(true)}>
                  Join Wait List
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <WaitlistModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
