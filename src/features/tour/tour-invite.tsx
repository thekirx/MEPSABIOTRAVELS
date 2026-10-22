"use client";
import { useState } from "react";
import { useTour } from "./tour";

const key = "travelos-tour-invite-hidden";

/** A small, dismissible invite on Home for people seeing TravelOS for the first time. */
export function TourInvite() {
  const { active, start } = useTour();
  // Home only renders after the saved demo loads in the browser, so reading
  // LocalStorage here is safe.
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  if (hidden || active) return null;
  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(key, "1");
    } catch {
      // Private mode: the invite simply shows again next time.
    }
  };
  return (
    <aside className="tour-invite no-print" aria-label="Guided tour">
      <p>
        <b>New to TravelOS?</b> See how it runs MEP&apos;s day in about 3
        minutes.
      </p>
      <div>
        <button type="button" className="btn lime" onClick={start}>
          Take the tour
        </button>
        <button
          type="button"
          className="tour-x"
          aria-label="Hide tour invite"
          onClick={hide}
        >
          ×
        </button>
      </div>
    </aside>
  );
}
