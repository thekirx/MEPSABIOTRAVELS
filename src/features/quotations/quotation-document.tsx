"use client";
import { AgencyLogo } from "@/components/agency-logo";
import { format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { destination } from "@/store/selectors";
import { destinationCity } from "@/domain/places";
import { quoteTotals } from "@/domain/quote";
import { money } from "@/domain/money";
import type { Quotation } from "@/domain/types";
export function QuotationDocument({ quote: q }: { quote: Quotation }) {
  const s = useTravelStore(),
    t = quoteTotals(q),
    customer = s.customers.find((c) => c.id === q.customerId),
    pkg = s.packages.find((p) => p.id === q.packageId);
  return (
    <article className="doc print-document">
      <header className="doc-top">
        <AgencyLogo />
        <span>QUOTATION</span>
      </header>
      <div className="doc-body">
        <h2>{destinationCity(destination(s, q))}</h2>
        <p className="for">
          For {customer?.name} · {q.paxCount} people
          <br />
          {format(parseISO(q.departDate), "d MMM")}–
          {format(parseISO(q.returnDate), "d MMM yyyy")}
        </p>
        {(q.flightDetails?.trim() || !!q.flightScreenshots?.length) && (
          <section className="doc-flights">
            <h3>
              Your flights <small>Not yet ticketed · fares may change</small>
            </h3>
            {q.flightDetails?.trim() && (
              <p className="doc-flight-text">{q.flightDetails.trim()}</p>
            )}
            {q.flightScreenshots?.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`Flight details ${i + 1}`} />
            ))}
          </section>
        )}
        <ul className="doc-services">
          {q.lines.map((l) => (
            <li key={l.id}>{l.description}</li>
          ))}
        </ul>
        <div className="doc-total">
          <span>Total for {q.paxCount}</span>
          <b className="num" data-testid="preview-total">
            {money(t.selling)}
          </b>
        </div>
        <div className="doc-each">
          <span>Each person</span>
          <span>{money(t.perPax)}</span>
        </div>
        <div className="doc-each">
          <span>Deposit (30%) · due within 3 days</span>
          <span>{money(Math.round(t.selling * 0.3))}</span>
        </div>
        <section className="doc-itinerary">
          <h3>Your itinerary</h3>
          {q.itineraryDays.map((day, i) => (
            <p key={i} className="itinerary-day">
              <b>Day {i + 1}</b>
              <span>{day}</span>
            </p>
          ))}
        </section>
        <div className="doc-inclusions">
          <section>
            <h3>Included</h3>
            <ul>
              {(
                q.inclusions ??
                pkg?.inclusions ?? ["Services listed above"]
              ).map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Not included</h3>
            <ul>
              {(q.exclusions ?? pkg?.exclusions ?? ["Personal expenses"]).map(
                (v, i) => (
                  <li key={i}>{v}</li>
                ),
              )}
            </ul>
          </section>
        </div>
        <div className="doc-terms">
          <p>
            {q.terms ??
              "30% deposit due within 3 days of acceptance. Balance due 30 days before departure."}
          </p>
          <p>
            Rates subject to availability until ticketed. Valid until{" "}
            {format(parseISO(q.validUntil), "d MMM yyyy")}.
          </p>
          <p>
            {q.ref} · Version {q.version} · Illustrative rates
          </p>
        </div>
      </div>
      <footer className="doc-foot">
        <span>reservations@meptravel.com</span>
        <span>mepsabiotravel.com</span>
        <span>DEMO — simulated data</span>
      </footer>
    </article>
  );
}
