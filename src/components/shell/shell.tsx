"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessagesSquare,
  FileText,
  CalendarDays,
  WalletCards,
  BookUser,
  Settings,
  Compass,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { useTravelStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Modal, notify } from "@/components/shared";
const nav = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/inquiries", "Inquiries", MessagesSquare],
  ["/quotations", "Quotations", FileText],
  ["/bookings", "Bookings", CalendarDays],
  ["/payments", "Payments", WalletCards],
  ["/visas", "Visas", BookUser],
  ["/settings", "Settings", Settings],
] as const;
export function Shell({ children }: { children: React.ReactNode }) {
  const s = useTravelStore();
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false),
    [search, setSearch] = useState(""),
    [reset, setReset] = useState(false);
  useEffect(() => {
    void useTravelStore.persist.rehydrate();
    const handler = (e: KeyboardEvent) => {
      if (
        e.shiftKey &&
        e.key.toLowerCase() === "r" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        setReset(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const q = search.toLowerCase().trim();
  const results = q
    ? [
        ...s.customers
          .filter((c) => c.name.toLowerCase().includes(q))
          .map((c) => ({
            label: c.name,
            sub: "Customer · inquiries",
            href: `/inquiries?customer=${c.id}`,
          })),
        ...s.bookings
          .filter((b) =>
            `${b.ref} ${s.customers.find((c) => c.id === b.customerId)?.name}`
              .toLowerCase()
              .includes(q),
          )
          .map((b) => ({
            label: b.ref,
            sub: s.customers.find((c) => c.id === b.customerId)?.name,
            href: `/bookings/view?id=${b.id}`,
          })),
        ...s.quotations
          .filter((b) =>
            `${b.ref} ${s.customers.find((c) => c.id === b.customerId)?.name}`
              .toLowerCase()
              .includes(q),
          )
          .map((b) => ({
            label: b.ref,
            sub: "Quotation",
            href: `/quotations/view?id=${b.id}`,
          })),
      ].slice(0, 9)
    : [];
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar no-print">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">
            <Compass size={29} />
          </span>
          {!collapsed && (
            <div>
              {s.hydrated ? s.settings.agencyName : "Horizon Travel & Tours"}
            </div>
          )}
        </Link>
        {!collapsed && (
          <div className="workspace-label">
            <span>AGENCY WORKSPACE</span>
            <strong>
              Optrizo TravelOS <ChevronDown size={14} />
            </strong>
          </div>
        )}
        <nav>
          {nav.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              title={label}
              className={path.startsWith(href) ? "active" : ""}
            >
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && label === "Inquiries" && s.hydrated && (
                <small>
                  {s.leads.filter((l) => l.stage === "New Inquiry").length}
                </small>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!collapsed && (
            <>
              <div className="agency-avatar">
                {s.hydrated ? s.settings.logoText : "H"}
              </div>
              <div>
                <strong>Isabel Santos</strong>
                <span>Agency owner</span>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
        {!collapsed && (
          <div className="powered">Built by Optrizo IT Solutions</div>
        )}
      </aside>
      <div className="workspace">
        <header className="topbar no-print">
          <div className="global-search">
            <Search size={17} />
            <Input
              aria-label="Global search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers, bookings or reference numbers…"
            />
            {q && (
              <div className="search-results">
                {results.length ? (
                  results.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => setSearch("")}
                    >
                      <div>
                        <strong>{r.label}</strong>
                        <small>{r.sub}</small>
                      </div>
                      <ArrowUpRight size={15} />
                    </Link>
                  ))
                ) : (
                  <p>No matching records.</p>
                )}
              </div>
            )}
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <i />
              DEMO — simulated data
            </span>
            <div className="avatar">IS</div>
          </div>
        </header>
        <main className="main-content">
          {s.hydrated ? (
            children
          ) : (
            <div className="loading-state" aria-label="Loading demo">
              <Skeleton className="h-10 w-80" />
              <div className="kpi-grid">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          )}
        </main>
        <footer className="app-footer no-print">
          <span>
            Optrizo TravelOS <span className="footer-dot">·</span> Your next
            journey, organized.
          </span>
          <span>Illustrative pricing · Locally saved demo</span>
        </footer>
      </div>
      <Toaster richColors position="bottom-right" />
      <Modal
        open={reset}
        onOpenChange={setReset}
        title="Reset demo data?"
        description="This restores all seed records and branding, and removes your demo changes."
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
            <RotateCcw />
            Reset demo
          </Button>
        </div>
      </Modal>
    </div>
  );
}
