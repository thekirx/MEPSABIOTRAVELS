"use client";
import Image from "next/image";
import { useTravelStore } from "@/store";
export function AgencyLogo({ compact = false }: { compact?: boolean }) {
  const { settings } = useTravelStore();
  if (settings.logoDataUrl)
    return (
      <Image
        className="agency-logo"
        src={settings.logoDataUrl}
        alt={settings.agencyName}
        width={compact ? 72 : 160}
        height={60}
        unoptimized
      />
    );
  if (settings.agencyName === "MEP Sabio Travel")
    return (
      <Image
        className="agency-logo"
        src={compact ? "/brand/mep-mark.png" : "/brand/mep-logo-full.png"}
        alt={settings.agencyName}
        width={compact ? 72 : 160}
        height={60}
      />
    );
  return (
    <strong>
      {settings.logoText} · {settings.agencyName}
    </strong>
  );
}
