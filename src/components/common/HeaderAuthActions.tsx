"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  Ticket,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SecureAvatar } from "@/components/users/SecureAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-context";
import { buildDisplayName, buildInitials } from "@/features/auth/auth-display";
import { userProfileQueryKey } from "@/features/auth/auth-cache";
import { patchAuthUser } from "@/features/auth/session-storage";
import { getMyProfile } from "@/features/users/api";
import { resolveAvatarSrc } from "@/features/users/profile-display";

type HeaderAuthActionsProps = {
  className?: string;
  onNavigate?: () => void;
  /** Stack buttons vertically (mobile drawer). */
  stacked?: boolean;
};

function dashboardIcon(href: string) {
  if (href.startsWith("/vendorDashboard")) return Store;
  if (href.startsWith("/userDashboard")) return Ticket;
  return LayoutDashboard;
}

export function HeaderAuthActions({
  className = "",
  onNavigate,
  stacked = false,
}: HeaderAuthActionsProps) {
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isReady, isRestoring, displayName, initials, dashboardLinks, logout, user } =
    useAuth();

  const { data: profile } = useQuery({
    queryKey: userProfileQueryKey(user?.id),
    queryFn: getMyProfile,
    enabled: isAuthenticated && !!user?.id,
  });

  const avatarSrc = resolveAvatarSrc(profile?.avatarUrl ?? user?.avatarUrl);

  const resolvedDisplayName = useMemo(() => {
    const source = profile ?? user;
    if (!source) return displayName;
    return buildDisplayName(source) || displayName;
  }, [profile, user, displayName]);

  const avatarInitials = useMemo(() => {
    const source = profile ?? user;
    if (!source) return initials;
    return buildInitials(source);
  }, [profile, user, initials]);

  useEffect(() => {
    if (!profile || !user) return;
    const next = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email ?? user.email,
      avatarUrl: profile.avatarUrl,
      phone: profile.phone ?? undefined,
      phoneCountryCode: profile.phoneCountryCode,
    };
    const changed =
      next.firstName !== user.firstName ||
      next.lastName !== user.lastName ||
      next.email !== user.email ||
      next.avatarUrl !== user.avatarUrl ||
      next.phone !== user.phone ||
      next.phoneCountryCode !== user.phoneCountryCode;
    if (changed) {
      patchAuthUser(next);
    }
  }, [profile, user]);

  if (!isReady) {
    return (
      <div
        className={`${stacked ? "w-full space-y-3" : "flex items-center gap-3"} ${className}`}
        aria-hidden
      >
        <div className="h-9 w-20 rounded-md bg-muted/40 animate-pulse" />
        {stacked ? (
          <div className="h-10 w-full rounded-md bg-muted/40 animate-pulse" />
        ) : (
          <div className="h-9 w-24 rounded-md bg-muted/40 animate-pulse" />
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isRestoring) {
      return (
        <div className={`${stacked ? "w-full" : ""} ${className}`} aria-hidden>
          <div className="h-9 w-9 rounded-full bg-muted/40 animate-pulse" />
        </div>
      );
    }

    return (
      <div
        className={`${stacked ? "w-full space-y-3" : "flex items-center gap-3"} ${className}`}
      >
        <Button
          asChild
          variant={stacked ? "outline" : "ghost"}
          size={stacked ? "default" : "sm"}
          className={stacked ? "h-11 w-full rounded-xl" : ""}
        >
          <Link href="/signup" onClick={onNavigate}>
            {tAuth("register")}
          </Link>
        </Button>
        <Button
          asChild
          size={stacked ? "default" : "sm"}
          className={stacked ? "h-11 w-full rounded-xl" : ""}
        >
          <Link href="/login" onClick={onNavigate}>
            {tAuth("login")}
          </Link>
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
          aria-label={tCommon("openAccountMenu")}
        >
          <SecureAvatar
            avatarUrl={avatarSrc}
            className="h-9 w-9 border border-border"
            fallbackClassName="bg-primary/15 text-primary text-sm font-medium"
            alt={resolvedDisplayName}
            fallback={avatarInitials}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">{resolvedDisplayName}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {dashboardLinks.map((link) => {
          const Icon = dashboardIcon(link.href);
          return (
            <DropdownMenuItem
              key={link.href}
              onSelect={() => {
                onNavigate?.();
                router.push(link.href);
              }}
            >
              <Icon className="size-4" />
              {tNav(link.labelKey)}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuItem
          onSelect={() => {
            onNavigate?.();
            router.push("/userDashboard/profile");
          }}
        >
          <Settings className="size-4" />
          {tNav("profileSettings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut className="size-4" />
          {tNav("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile drawer: full-width links mirroring the avatar menu. */
export function HeaderAuthMobileLinks({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const tNav = useTranslations("nav");
  const { isAuthenticated, isReady, displayName, dashboardLinks, logout } = useAuth();

  if (!isReady) return null;

  if (!isAuthenticated) {
    return (
      <HeaderAuthActions stacked onNavigate={onNavigate} className="w-full" />
    );
  }

  return (
    <div className="space-y-1">
      <p className="mb-2 px-3 text-sm font-medium text-foreground">{displayName}</p>
      {dashboardLinks.map((link) => (
        <button
          key={link.href}
          type="button"
          className="flex w-full items-center rounded-xl px-3 py-3 text-left text-[15px] font-medium text-foreground/90 transition-colors hover:bg-white/5 hover:text-primary"
          onClick={() => {
            onNavigate?.();
            router.push(link.href);
          }}
        >
          {tNav(link.labelKey)}
        </button>
      ))}
      <button
        type="button"
        className="flex w-full items-center rounded-xl px-3 py-3 text-left text-[15px] font-medium text-foreground/90 transition-colors hover:bg-white/5 hover:text-primary"
        onClick={() => {
          onNavigate?.();
          router.push("/userDashboard/profile");
        }}
      >
        {tNav("profileSettings")}
      </button>
      <button
        type="button"
        className="flex w-full items-center rounded-xl px-3 py-3 text-left text-[15px] font-medium text-destructive transition-colors hover:bg-destructive/10"
        onClick={async () => {
          onNavigate?.();
          await logout();
        }}
      >
        {tNav("logout")}
      </button>
    </div>
  );
}
