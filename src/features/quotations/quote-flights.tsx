"use client";
import { useState } from "react";
import { type Quotation } from "@/domain/types";
import { Sheet } from "@/components/blocks";
import { Field } from "@/components/shared";
import { Button } from "@/components/ui/button";

const maxShots = 4;

/** Shrinks a screenshot so several fit in the browser's saved data. */
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/"))
      return reject(new Error("Use a PNG, JPEG or WebP screenshot."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1400 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    img.src = url;
  });
}

export function QuoteFlightsSection({
  q,
  locked,
  update,
}: {
  q: Quotation;
  locked: boolean;
  update: (patch: Partial<Quotation>) => void;
}) {
  const [error, setError] = useState("");
  const shots = q.flightScreenshots ?? [];
  const add = async (files: File[]) => {
    setError("");
    const room = maxShots - shots.length;
    if (!files.length) return;
    if (room <= 0) return setError(`Up to ${maxShots} screenshots per quote.`);
    try {
      const added = await Promise.all(files.slice(0, room).map(compress));
      update({ flightScreenshots: [...shots, ...added] });
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Sheet
      id="flights"
      title="Flights"
      note="Shown to the customer as their flight details (not yet ticketed)"
    >
      <div className="section-stack">
        <Field label="Flight details — airline, flight numbers, times, connections">
          <textarea
            aria-label="Flight details"
            rows={4}
            disabled={locked}
            placeholder={
              "Going · Fri 5 Dec · PR 428 Manila 08:05 → Tokyo Narita 13:30 · direct\nReturn · Wed 10 Dec · PR 411 Osaka 15:10 → Manila 19:00"
            }
            value={q.flightDetails ?? ""}
            onChange={(e) => update({ flightDetails: e.target.value })}
          />
        </Field>
        {!locked && (
          <div
            className="shot-drop"
            tabIndex={0}
            role="button"
            aria-label="Paste or drop flight screenshots"
            onPaste={(e) => {
              const files = [...e.clipboardData.files];
              if (files.length) {
                e.preventDefault();
                add(files);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              add([...e.dataTransfer.files]);
            }}
          >
            <b>Paste a flight screenshot here</b>
            <span>
              Click this box and press ⌘V / Ctrl+V, drop an image, or{" "}
              <label className="linkish">
                choose a file
                <input
                  aria-label="Upload flight screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  hidden
                  onChange={(e) => {
                    add([...(e.target.files ?? [])]);
                    e.target.value = "";
                  }}
                />
              </label>
              .
            </span>
          </div>
        )}
        {error && (
          <p className="danger-text" role="alert">
            {error}
          </p>
        )}
        {shots.length > 0 && (
          <div className="shot-grid">
            {shots.map((src, i) => (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Flight screenshot ${i + 1}`} />
                {!locked && (
                  <Button
                    variant="outline"
                    aria-label={`Remove flight screenshot ${i + 1}`}
                    onClick={() =>
                      update({
                        flightScreenshots: shots.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Remove
                  </Button>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
