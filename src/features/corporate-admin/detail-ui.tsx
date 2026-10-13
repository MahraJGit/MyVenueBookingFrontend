"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DashboardPanel,
  DashboardStatCard,
  dashboardOutlineButtonClass,
  dashboardSurfaceClass,
} from "@/components/dashboard/dashboard-ui";
import { cn } from "@/lib/utils";

export function CorporateBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Button asChild variant="outline" size="sm" className={dashboardOutlineButtonClass}>
      <Link href={href}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

export function CorporateAvatar({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={cn(
          "h-16 w-16 shrink-0 rounded-2xl border border-[#303030] object-cover sm:h-20 sm:w-20",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/25 to-primary/5 text-lg font-semibold tracking-wide text-primary sm:h-20 sm:w-20 sm:text-xl",
        className,
      )}
      aria-hidden
    >
      {initials || "—"}
    </div>
  );
}

export function CorporateDetailHero({
  backHref,
  backLabel,
  title,
  description,
  avatarName,
  avatarUrl,
  badges,
  actions,
  meta,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  avatarName: string;
  avatarUrl?: string | null;
  badges?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <DashboardPanel className="relative overflow-hidden !space-y-5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent"
        aria-hidden
      />
      <div className="relative">
        <CorporateBackLink href={backHref} label={backLabel} />
      </div>
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <CorporateAvatar name={avatarName} imageUrl={avatarUrl} />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
              {badges}
            </div>
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
            {meta ? (
              <div className="flex flex-wrap gap-2 pt-1">{meta}</div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">{actions}</div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}

export function CorporateMetaChip({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#303030] bg-[#151515] px-3 py-1 text-xs text-zinc-300">
      {icon}
      {children}
    </span>
  );
}

export function CorporateStatGrid({
  items,
}: {
  items: Array<{ icon: ReactNode; label: string; value: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <DashboardStatCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  );
}

export function CorporateSection({
  icon,
  title,
  description,
  action,
  children,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DashboardPanel className={cn("!space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#303030] bg-[#151515] text-primary">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </DashboardPanel>
  );
}

export function CorporateInfoTile({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#303030] bg-[#151515]/80 p-3.5 transition hover:border-[#3a3a3a]",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <div className="mt-1.5 text-sm font-medium break-words text-zinc-100">
        {value || "—"}
      </div>
    </div>
  );
}

export function CorporateInfoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>{children}</div>
  );
}

export function CorporateEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className={cn(dashboardSurfaceClass, "py-10 text-center text-sm text-muted-foreground")}>
      {children}
    </div>
  );
}

export function CorporateListCard({
  href,
  title,
  subtitle,
  trailing,
  children,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-white">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {trailing}
      </div>
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-[#303030] bg-[#151515]/60 p-4 transition hover:border-primary/40 hover:bg-[#181818]"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-[#303030] bg-[#151515]/60 p-4">
      {body}
    </div>
  );
}

export function statusToneClass(
  tone: "success" | "danger" | "warning" | "neutral",
) {
  if (tone === "success") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  if (tone === "danger") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  if (tone === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  return "border-[#303030] bg-[#1a1a1a] text-zinc-300";
}

export function CorporateStatusBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "danger" | "warning" | "neutral";
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border text-xs font-medium", statusToneClass(tone))}
    >
      {children}
    </Badge>
  );
}

export function CorporateAlert({
  tone,
  title,
  children,
}: {
  tone: "danger" | "warning";
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm",
        tone === "danger"
          ? "border-red-500/30 bg-red-500/10"
          : "border-amber-500/30 bg-amber-500/10",
      )}
    >
      <p
        className={cn(
          "font-medium",
          tone === "danger" ? "text-red-200" : "text-amber-200",
        )}
      >
        {title}
      </p>
      <div className="mt-1 whitespace-pre-wrap text-zinc-300">{children}</div>
    </div>
  );
}

export function CorporateProseBlock({
  title,
  body,
}: {
  title: string;
  body: string | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-[#303030] bg-[#151515]/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed text-zinc-200">
        {body?.trim() ? body : "—"}
      </p>
    </div>
  );
}
