"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
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
import { mobileNavLinkActiveVisualClass, navLinkActiveVisualClass } from "@/components/common/nav-link-styles";
import { cn } from "@/lib/utils";

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

function isDashboardActive(pathname: string, href: string) {
  if (href.startsWith("/userDashboard")) {
    return pathname.startsWith("/userDashboard");
  }
  if (href.startsWith("/vendorDashboard")) {
    return pathname.startsWith("/vendorDashboard");
  }
  if (href.startsWith("/adminDashbaord") || href.startsWith("/adminDashboard")) {
    return (
      pathname.startsWith("/adminDashbaord") ||
      pathname.startsWith("/adminDashboard")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabelKey(role?: string): "roleBuyer" | "roleVendor" | "roleAdmin" {
  if (role === "VENDOR") return "roleVendor";
  if (role === "ADMIN") return "roleAdmin";
  return "roleBuyer";
}

export function HeaderAuthActions({
  className = "",
  onNavigate,
  stacked = false,
}: HeaderAuthActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
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
        className={`${stacked ? "w-full space-y-3" : "flex items-center gap-1.5"} ${className}`}
        aria-hidden
      >
        <div className="h-9 w-16 rounded-md bg-muted/40 animate-pulse" />
        {stacked ? (
          <div className="h-10 w-full rounded-md bg-muted/40 animate-pulse" />
        ) : (
          <div className="h-9 w-20 rounded-md bg-muted/40 animate-pulse" />
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
        className={`${stacked ? "w-full space-y-3" : "flex items-center gap-1.5"} ${className}`}
      >
        <Button
          asChild
          variant={stacked ? "outline" : "ghost"}
          size={stacked ? "default" : "sm"}
          className={stacked ? "h-11 w-full rounded-xl" : "px-2.5"}
        >
          <Link href="/signup" onClick={onNavigate}>
            {tAuth("signup")}
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size={stacked ? "default" : "sm"}
          className={cn(
            stacked ? "h-11 w-full" : "px-2.5",
            stacked ? mobileNavLinkActiveVisualClass : navLinkActiveVisualClass,
          )}
        >
          <Link href="/login" onClick={onNavigate}>
            {tAuth("signIn")}
          </Link>
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
  };

  const roleKey = roleLabelKey(user?.role);

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
          <p className="mt-1 text-xs text-muted-foreground">
            {tCommon(roleKey)}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {dashboardLinks.map((link) => {
          const Icon = dashboardIcon(link.href);
          const active = isDashboardActive(pathname, link.href);
          return (
            <DropdownMenuItem
              key={link.href}
              onSelect={() => {
                onNavigate?.();
                router.push(link.href);
              }}
              className={cn(active && "bg-primary/10 text-primary")}
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
          className={cn(
            pathname.startsWith("/userDashboard/profile") &&
              "bg-primary/10 text-primary",
          )}
        >
          <Settings className="size-4" />
          {tNav("profileSettings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onNavigate?.();
            router.push("/");
          }}
        >
          <ExternalLink className="size-4" />
          {tCommon("backToSite")}
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
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isReady, displayName, dashboardLinks, logout, user } =
    useAuth();

  if (!isReady) return null;

  if (!isAuthenticated) {
    return (
      <HeaderAuthActions stacked onNavigate={onNavigate} className="w-full" />
    );
  }

  const roleKey = roleLabelKey(user?.role);

  return (
    <div className="space-y-1">
      <div className="mb-2 px-3">
        <p className="text-sm font-medium text-foreground">{displayName}</p>
        <p className="text-xs text-muted-foreground">{tCommon(roleKey)}</p>
      </div>
      {dashboardLinks.map((link) => {
        const active = isDashboardActive(pathname, link.href);
        return (
          <button
            key={link.href}
            type="button"
            className={cn(
              "flex w-full items-center rounded-xl px-3 py-3 text-start text-[15px] font-medium transition-colors hover:bg-white/5 hover:text-primary",
              active ? "bg-primary/10 text-primary" : "text-foreground/90",
            )}
            onClick={() => {
              onNavigate?.();
              router.push(link.href);
            }}
          >
            {tNav(link.labelKey)}
          </button>
        );
      })}
      <button
        type="button"
        className={cn(
          "flex w-full items-center rounded-xl px-3 py-3 text-start text-[15px] font-medium transition-colors hover:bg-white/5 hover:text-primary",
          pathname.startsWith("/userDashboard/profile")
            ? "bg-primary/10 text-primary"
            : "text-foreground/90",
        )}
        onClick={() => {
          onNavigate?.();
          router.push("/userDashboard/profile");
        }}
      >
        {tNav("profileSettings")}
      </button>
      <button
        type="button"
        className="flex w-full items-center rounded-xl px-3 py-3 text-start text-[15px] font-medium text-foreground/90 transition-colors hover:bg-white/5 hover:text-primary"
        onClick={() => {
          onNavigate?.();
          router.push("/");
        }}
      >
        {tCommon("backToSite")}
      </button>
      <button
        type="button"
        className="flex w-full items-center rounded-xl px-3 py-3 text-start text-[15px] font-medium text-destructive transition-colors hover:bg-destructive/10"
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
