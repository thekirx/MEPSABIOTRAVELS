"use client";
import { useState } from "react";
import { RotateCcw, Check, ExternalLink } from "lucide-react";
import { AgencyLogo } from "@/components/agency-logo";
import { useTravelStore } from "@/store";
import { PageHeader, Field, Modal, notify } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function SettingsPage() {
  const s = useTravelStore();
  const [reset, setReset] = useState(false);
  const [logoError, setLogoError] = useState("");
  return (
    <>
      <PageHeader
        title="Workspace settings"
        description="Make this workspace feel like your agency."
      />
      <div className="settings-layout">
        <section className="sheet">
          <div className="panel-header">
            <h2>Agency identity</h2>
            <AgencyLogo />
          </div>
          <form
            className="panel-body section-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              notify(
                () =>
                  s.updateSettings({
                    ...s.settings,
                    agencyName: String(d.get("agency")).trim(),
                    logoText: String(d.get("logo")),
                  }),
                "Agency identity updated",
              );
            }}
            key={`${s.settings.agencyName}-${s.settings.logoText}`}
          >
            <Field label="Agency name">
              <Input
                name="agency"
                aria-label="Agency name"
                defaultValue={s.settings.agencyName}
                required
                maxLength={60}
              />
            </Field>
            <Field label="Logo text / initials">
              <Input
                name="logo"
                aria-label="Logo text"
                defaultValue={s.settings.logoText}
                required
                maxLength={4}
              />
            </Field>
            <Field label="Upload logo (PNG, JPEG or WebP)">
              <Input
                aria-label="Upload logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    !["image/png", "image/jpeg", "image/webp"].includes(
                      file.type,
                    ) ||
                    file.size > 500000
                  ) {
                    setLogoError("Choose a PNG, JPEG or WebP under 500 KB.");
                    return;
                  }
                  setLogoError("");
                  const reader = new FileReader();
                  reader.onerror = () =>
                    setLogoError(
                      "The image could not be read. Try another file.",
                    );
                  reader.onload = () =>
                    notify(
                      () =>
                        s.updateSettings({
                          ...s.settings,
                          logoDataUrl: String(reader.result),
                        }),
                      "Logo saved in this browser",
                    );
                  reader.readAsDataURL(file);
                }}
              />
              {logoError && (
                <p role="alert" className="danger-text">
                  {logoError}
                </p>
              )}
              <small>Saved in this browser only. Maximum 500 KB.</small>
            </Field>
            {s.settings.logoDataUrl && (
              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  notify(
                    () =>
                      s.updateSettings({
                        ...s.settings,
                        logoDataUrl: undefined,
                      }),
                    "Uploaded logo removed",
                  )
                }
              >
                Remove uploaded logo
              </Button>
            )}
            <p className="subtle-note">
              Shown in the top bar, customer quotations, and statements.
            </p>
            <div>
              <Button type="submit">
                <Check />
                Save identity
              </Button>
            </div>
          </form>
        </section>
        <section className="sheet">
          <div className="panel-header">
            <h2>About this workspace</h2>
          </div>
          <div className="panel-body about-demo">
            <div>
              <span>Product</span>
              <strong>Optrizo TravelOS</strong>
            </div>
            <div>
              <span>Built by</span>
              <strong>Optrizo Information Technology Solutions</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>Pre-sales demo · simulated data</strong>
            </div>
            <div>
              <span>Storage</span>
              <strong>This browser only · LocalStorage</strong>
            </div>
            <p className="subtle-note">
              All prices are illustrative. No tickets, real payments, or visa
              submissions are processed.
            </p>
            <a
              href="https://www.facebook.com/mepsabiotravel/"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Client Facebook reference <ExternalLink size={12} />
            </a>
          </div>
        </section>
        <section className="sheet reset-panel">
          <div className="panel-header">
            <h2>A fresh start for every presentation</h2>
          </div>
          <div className="panel-body">
            <p>
              Restore the original customers, quotations, bookings, payments and
              agency identity. Your demo changes will be removed.
            </p>
            <Button variant="outline" onClick={() => setReset(true)}>
              <RotateCcw />
              Reset demo data
            </Button>
            <span className="subtle-note">Keyboard shortcut: Shift + R</span>
          </div>
        </section>
      </div>
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
    </>
  );
}
