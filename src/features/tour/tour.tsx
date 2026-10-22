"use client";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { usePathname, useRouter } from "next/navigation";
import { tourSteps } from "./tour-steps";

/** Tour state lives outside the saved demo data, so it never changes records. */
export const useTour = create<{
  active: boolean;
  index: number;
  start: () => void;
  go: (index: number) => void;
  stop: () => void;
}>((set) => ({
  active: false,
  index: 0,
  start: () => set({ active: true, index: 0 }),
  go: (index) =>
    set({ index: Math.max(0, Math.min(tourSteps.length - 1, index)) }),
  stop: () => set({ active: false }),
}));

const clean = (path: string) => path.replace(/\/+$/, "") || "/";
const pathOf = (href: string) => clean(href.split("?")[0]);

type Box = { top: number; left: number; width: number; height: number };

export function TourButton({ className = "" }: { className?: string }) {
  const start = useTour((t) => t.start);
  return (
    <button
      type="button"
      className={`tour-btn ${className}`}
      aria-label="Take the tour"
      onClick={start}
    >
      <span className="tour-btn-long">Take the tour</span>
      <span className="tour-btn-short" aria-hidden="true">
        Tour
      </span>
    </button>
  );
}

export function Tour() {
  const { active, index, go, stop } = useTour();
  const router = useRouter(),
    pathname = usePathname();
  const step = tourSteps[index];
  // Highlights are keyed to the step and page they were found on, so a
  // stale one from the previous step is simply ignored.
  const key = `${index}:${pathname}`;
  const [found, setFound] = useState<{ key: string; el: Element } | null>(null),
    [tracked, setTracked] = useState<{ key: string; box: Box } | null>(null);
  const target = found?.key === key ? found.el : null,
    box = target && tracked?.key === key ? tracked.box : null;
  const nextRef = useRef<HTMLButtonElement>(null),
    cardRef = useRef<HTMLElement>(null);
  const [cardH, setCardH] = useState(240);
  const last = index === tourSteps.length - 1;

  // Open the step's page if we're not already on it.
  useEffect(() => {
    if (!active || !step.href) return;
    const here = clean(window.location.pathname) + window.location.search;
    const want =
      pathOf(step.href) +
      (step.href.split("?")[1] ? `?${step.href.split("?")[1]}` : "");
    if (here !== want) router.push(step.href);
  }, [active, index, step.href, router]);

  // Find the element to point at once the right page has rendered.
  useEffect(() => {
    if (!active || !step.targets) return;
    if (step.href && clean(pathname) !== pathOf(step.href)) return;
    const stepKey = `${index}:${pathname}`;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = step
        .targets!.map((sel) => document.querySelector(sel))
        .find(Boolean);
      if (el || ++tries > 40) {
        window.clearInterval(timer);
        if (!el) return;
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        // Scroll the highlight to just under the top bar so the step card
        // fits below it. Small items that already fit stay centred.
        const r = el.getBoundingClientRect();
        const topBar = document.querySelector(".appbar")?.clientHeight ?? 0;
        const room = window.innerHeight - topBar - 24 - 260;
        // Absolute position, so an earlier smooth scroll can't skew it.
        const pageTop = r.top + window.scrollY;
        window.scrollTo({
          top: Math.max(
            0,
            r.height <= room
              ? pageTop - topBar - 24
              : pageTop - (window.innerHeight - r.height) / 2,
          ),
          behavior: reduce ? "auto" : "smooth",
        });
        setFound({ key: stepKey, el });
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, [active, index, pathname, step]);

  // Keep the highlight on the element while the page scrolls or resizes.
  useEffect(() => {
    if (!found) return;
    let frame = 0;
    const track = () => {
      const r = found.el.getBoundingClientRect();
      setTracked((t) =>
        t &&
        t.key === found.key &&
        t.box.top === r.top &&
        t.box.left === r.left &&
        t.box.width === r.width &&
        t.box.height === r.height
          ? t
          : {
              key: found.key,
              box: {
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
              },
            },
      );
      frame = window.requestAnimationFrame(track);
    };
    frame = window.requestAnimationFrame(track);
    return () => window.cancelAnimationFrame(frame);
  }, [found]);

  // Keyboard: arrows move, Escape closes.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === "Escape") stop();
      else if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, index, go, stop]);

  useEffect(() => {
    if (active) nextRef.current?.focus({ preventScroll: true });
  }, [active, index]);

  // Measure the step card so it can sit next to the highlight, not on it.
  useEffect(() => {
    const card = cardRef.current;
    if (!active || !card) return;
    const ro = new ResizeObserver(([entry]) =>
      setCardH(Math.ceil(entry.contentRect.height) + 36),
    );
    ro.observe(card);
    return () => ro.disconnect();
  }, [active]);

  if (!active) return null;

  const pad = 8;
  const side =
    box && box.left + box.width / 2 > window.innerWidth / 2 ? "left" : "right";
  // Desktop: put the card just below the highlight, or above it, wherever it
  // fits. Phones always use a bottom sheet.
  const placed = (() => {
    const vw = window.innerWidth,
      vh = window.innerHeight;
    if (!box || vw <= 760) return null;
    const w = Math.min(400, vw - 32),
      gap = 14;
    const left = Math.min(Math.max(16, box.left - pad), vw - w - 16);
    const below = box.top + box.height + pad + gap;
    if (below + cardH <= vh - 12) return { top: below, left };
    const above = box.top - pad - gap - cardH;
    if (above >= 12) return { top: above, left };
    return null;
  })();

  return (
    <div className="tour" aria-live="polite">
      {box ? (
        <div
          className="tour-spot"
          style={{
            top: box.top - pad,
            left: box.left - pad,
            width: box.width + pad * 2,
            height: box.height + pad * 2,
          }}
        />
      ) : (
        <div className="tour-dim" />
      )}
      <section
        ref={cardRef}
        className={`tour-card ${box ? (placed ? "tour-placed" : `tour-${side}`) : "tour-center"}`}
        style={placed ?? undefined}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
      >
        <div className="tour-top">
          <span className="tour-count">
            {index + 1} of {tourSteps.length}
          </span>
          <button
            type="button"
            className="tour-x"
            aria-label="Close tour"
            onClick={stop}
          >
            ×
          </button>
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p>{step.body}</p>
        <div
          className="tour-dots"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={tourSteps.length}
          aria-valuenow={index + 1}
          aria-label="Tour progress"
        >
          {tourSteps.map((_, i) => (
            <i key={i} className={i <= index ? "on" : ""} />
          ))}
        </div>
        <div className="tour-actions">
          {index > 0 ? (
            <button
              type="button"
              className="tour-back"
              onClick={() => go(index - 1)}
            >
              Back
            </button>
          ) : (
            <button type="button" className="tour-back" onClick={stop}>
              Skip
            </button>
          )}
          <button
            ref={nextRef}
            type="button"
            className="tour-next"
            onClick={() => {
              if (last) {
                stop();
                router.push("/dashboard");
              } else go(index + 1);
            }}
          >
            {index === 0 ? "Start" : last ? "Finish" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}
