"use client";

import { useState } from "react";
import Header from "./Header";
import WaitlistModal from "./WaitlistModal";

const HERO_TITLE_TOP = "The operating system for";
const HERO_TITLE_BOTTOM = "modern creators";
const HERO_SUBTITLE =
  "Creatorum is a creator-centric platform that helps you monetize your content, resell products, access brand deals and understand your performance - all in one platform.";

export default function HomePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="homeShell">
      <Header onJoinWaitlist={() => setOpen(true)} />

      <main className="homeMain">
        <div className="container">
          <section className="homeContent" aria-label="Creatorum home">
            <div>
              <h1 className="homeTitle">
                {HERO_TITLE_TOP}
                <br />
                {HERO_TITLE_BOTTOM}
              </h1>
              <p className="homeSubtitle">{HERO_SUBTITLE}</p>
            </div>

            <div className="homeMedia">
              <div className="homeMediaCard">
                <img className="homeMediaImg" src="/pagephoto.png" alt="Creatorum product preview" />
              </div>
            </div>

            <div className="homeActions">
              <button className="homeJoinBtn" type="button" onClick={() => setOpen(true)}>
                Join the Waitlist!
              </button>
              <div className="homeMeta">Early access opening soon.</div>
              <div className="homeSwipe">Swipe to view more</div>
            </div>
          </section>
        </div>
      </main>

      <WaitlistModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
