"use client";
import { useState } from "react";
import { markupPerPax } from "@/domain/quote";
import { money } from "@/domain/money";
import type { Quotation } from "@/domain/types";
import { Field } from "@/components/shared";
import { Input } from "@/components/ui/input";

/** Common markups per traveler, in centavos (₱500 to ₱2,000). */
export const markupPresets = [50000, 100000, 150000, 200000];

/** Fixed peso markup per traveler, with quick picks and an "Other" amount. */
export function MarkupPicker({
  q,
  locked,
  onChange,
}: {
  q: Quotation;
  locked: boolean;
  onChange: (centavos: number) => void;
}) {
  const current = markupPerPax(q);
  const [other, setOther] = useState(!markupPresets.includes(current));
  return (
    <>
      <div
        className="markup-options"
        role="radiogroup"
        aria-label="Markup per person"
      >
        {markupPresets.map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={current === v}
            disabled={locked}
            onClick={() => onChange(v)}
          >
            {money(v).replace(".00", "")}
          </button>
        ))}
      </div>
      <div className="custom-markup">
        <button
          className="linkish"
          disabled={locked}
          onClick={() => setOther(!other)}
        >
          Other amount…
        </button>
        {other && (
          <Field label="Markup per person (PHP)">
            <Input
              aria-label="Markup per person (PHP)"
              type="number"
              min="0"
              step="50"
              value={current / 100}
              disabled={locked}
              onChange={(e) =>
                onChange(Math.round(Number(e.target.value) * 100))
              }
            />
          </Field>
        )}
      </div>
    </>
  );
}
