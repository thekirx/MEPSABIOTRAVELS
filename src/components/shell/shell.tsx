"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AgencyLogo } from "@/components/agency-logo";
import { usePathname } from "next/navigation";
import { Search, ArrowUpRight } from "lucide-react";
import { useTravelStore } from "@/store";
import { financials } from "@/store/selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Modal, notify, Field } from "@/components/shared";
import { permissions } from "@/domain/roles";
import { persistGate } from "@/store/persist-gate";
import type { DemoData } from "@/domain/types";
const nav = [
  ["/dashboard", "Home"],
  ["/inquiries", "People asking"],
  ["/quotations", "Quotes"],
  ["/payments", "Payments"],
  ["/visas", "Visas"],
] as const;
const pageNames: Record<string, string> = {
  dashboard: "Home",
  inquiries: "People asking",
  quotations: "Quotes",
  bookings: "Trips",
  payments: "Payments",
  visas: "Visas",
  settings: "Settings",
  customers: "Customer",
  salary: "Salary",
  approve: "Your quotation",
};
export function Shell({ children }: { children: React.ReactNode }) {
  const s = useTravelStore(),
    path = usePathname();
  const [searchOpen, setSearchOpen] = useState(false),
    [menu, setMenu] = useState(false),
    [search, setSearch] = useState(""),
    [reset, setReset] = useState(false);
  useEffect(() => {
    void useTravelStore.persist.rehydrate();
    const handler = (e: KeyboardEvent) => {
      const t = e.target;
      if (
        e.shiftKey &&
        e.key.toLowerCase() === "r" &&
        !(t instanceof HTMLInputElement) &&
        !(t instanceof HTMLTextAreaElement) &&
        !(t instanceof HTMLSelectElement) &&
        !(t instanceof HTMLElement && t.isContentEditable)
      ) {
        e.preventDefault();
        setReset(true);
      }
    };
    // Another tab (e.g. the client approval page) saved changes: reload them,
    // so the team view updates without a refresh.
    const sync = (e: StorageEvent) => {
      if (e.key !== useTravelStore.persist.getOptions().name || !e.newValue)
        return;
      try {
        const saved = JSON.parse(e.newValue) as { state?: Partial<DemoData> };
        if (!saved.state) return;
        persistGate.paused = true;
        useTravelStore.setState(saved.state);
      } catch {
        // Ignore unreadable data from another tab.
      } finally {
        persistGate.paused = false;
      }
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.title = `${pageNames[path.split("/")[1]] ?? "TravelOS"} · ${s.settings.agencyName}`;
    });
    return () => cancelAnimationFrame(frame);
  }, [path, s.settings.agencyName, s.hydrated]);
  const me = s.agents.find((a) => a.id === s.currentAgentId) ?? s.agents[0],
    can = permissions(me?.role);
  const links = can.canSeeSalary
    ? [...nav, ["/salary", "Salary"] as const]
    : nav;
  if (path.startsWith("/approve"))
    return (
      <div className="client-shell">
        <header className="client-bar no-print">
          <div className="client-bar-in">
            <AgencyLogo compact />
            <span className="demo">
              DEMO <span>— no real payment</span>
            </span>
          </div>
        </header>
        <main className="client-main">
          {s.hydrated ? (
            children
          ) : (
            <div className="section-stack" aria-label="Loading quotation">
              <Skeleton className="h-16 w-64" />
              <Skeleton className="h-80 w-full" />
            </div>
          )}
        </main>
        <footer className="client-foot">
          <span>
            <b>{s.settings.agencyName}</b> · reservations@meptravel.com ·
            mepsabiotravel.com
          </span>
          <span>Demo page. No real booking or payment is made.</span>
        </footer>
        <Toaster position="bottom-center" />
      </div>
    );
  const q = search.toLowerCase().trim();
  const results = q
    ? [
        ...s.customers
          .filter((c) => c.name.toLowerCase().includes(q))
          .map((c) => ({
            label: c.name,
            sub: "Customer",
            href: `/customers/view?id=${c.id}`,
          })),
        ...s.bookings
          .filter((b) =>
            `${b.ref} ${s.customers.find((c) => c.id === b.customerId)?.name}`
              .toLowerCase()
              .includes(q),
          )
          .map((b) => ({
            label: b.ref,
            sub: "Trip",
            href: `/bookings/view?id=${b.id}`,
          })),
        ...s.quotations
          .filter((x) =>
            `${x.ref} ${s.customers.find((c) => c.id === x.customerId)?.name}`
              .toLowerCase()
              .includes(q),
          )
          .map((x) => ({
            label: x.ref,
            sub: "Quote",
            href: `/quotations/view?id=${x.id}`,
          })),
      ].slice(0, 9)
    : [];
  return (
    <div className="app-shell">
      <header className="appbar no-print">
        <div className="appbar-in">
          <Link
            className="brand"
            href="/dashboard"
            aria-label={s.settings.agencyName}
          >
            <AgencyLogo compact />
          </Link>
          <nav className="topnav" aria-label="Main">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={
                  path.startsWith(href) ||
                  (href === "/dashboard" && path.startsWith("/bookings"))
                    ? "active"
                    : ""
                }
                aria-current={path === href ? "page" : undefined}
              >
                {label}
                {label === "Payments" &&
                  s.hydrated &&
                  s.bookings.some(
                    (b) =>
                      b.status !== "Cancelled" &&
                      financials(s, b).status === "Overdue",
                  ) && <span className="dot" aria-label="has late payments" />}
              </Link>
            ))}
          </nav>
          <div className="appbar-right">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search />
            </Button>
            <span className="demo">
              DEMO <span>— simulated data</span>
            </span>
            <div className="account-menu">
              <button
                className="me"
                aria-label="Account menu"
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                {me?.initials ?? "?"}
              </button>
              {menu && (
                <div className="account-dropdown">
                  <p className="switch-label">Signed in as (demo)</p>
                  <div role="radiogroup" aria-label="Switch staff member">
                    {s.agents.map((a) => (
                      <button
                        key={a.id}
                        role="radio"
                        aria-checked={a.id === me?.id}
                        className="switch-staff"
                        onClick={() => {
                          notify(
                            () => s.setCurrentAgent(a.id),
                            `Now using the portal as ${a.name} (${a.role})`,
                          );
                          setMenu(false);
                        }}
                      >
                        <span className="mini-av">{a.initials}</span>
                        <span>
                          {a.name}
                          <small>{a.role}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                  <hr />
                  <Link href="/settings" onClick={() => setMenu(false)}>
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setReset(true);
                      setMenu(false);
                    }}
                  >
                    Reset demo data
                  </button>
                  <button onClick={() => setMenu(false)}>Close menu</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="page main-content">
        {s.hydrated ? (
          children
        ) : (
          <div className="section-stack" aria-label="Loading demo">
            <Skeleton className="h-16 w-64" />
            <Skeleton className="h-80 w-full" />
          </div>
        )}
      </main>
      <footer className="footer no-print">
        <span>
          <b>{s.hydrated ? s.settings.agencyName : "MEP Sabio Travel"}</b> ·
          Quality travel for less
        </span>
        <span>reservations@meptravel.com</span>
        <span>mepsabiotravel.com</span>
        <span>DEMO — simulated data. No real customers or payments.</span>
      </footer>
      <Toaster position="bottom-right" />
      <Modal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find a person or trip"
        description="Search customers, trip references or quotations."
      >
        <Field label="Global search">
          <Input
            aria-label="Global search"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or reference…"
          />
        </Field>
        <div className="search-results">
          {results.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              onClick={() => {
                setSearchOpen(false);
                setSearch("");
              }}
            >
              <div>
                <strong>{r.label}</strong>
                <small>{r.sub}</small>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
          {q && !results.length && <p>No matching records.</p>}
        </div>
      </Modal>
      <Modal
        open={reset}
        onOpenChange={setReset}
        title="Reset demo data?"
        description="This restores all seed records and MEP branding. Your demo changes will be removed."
      >
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setReset(false)}>
            Keep changes
          </Button>
          <Button
            onClick={() => {
              notify(
                () => s.resetDemo(),
                "Demo restored to its starting state",
              );
              setReset(false);
            }}
          >
            Reset demo
          </Button>
        </div>
      </Modal>
    </div>
  );
}
