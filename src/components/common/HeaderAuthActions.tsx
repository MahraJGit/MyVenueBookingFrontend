"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-context";

type HeaderAuthActionsProps = {
  className?: string;
  onNavigate?: () => void;
  /** Stack buttons vertically (mobile drawer). */
  stacked?: boolean;
};

function dashboardIcon(label: string) {
  if (label.includes("Vendor")) return Store;
  if (label.includes("Customer")) return Ticket;
  return LayoutDashboard;
}

export function HeaderAuthActions({
  className = "",
  onNavigate,
  stacked = false,
}: HeaderAuthActionsProps) {
  const router = useRouter();
  const { isAuthenticated, isReady, displayName, initials, dashboardLinks, logout } =
    useAuth();

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
    return (
      <div
        className={`${stacked ? "w-full space-y-3" : "flex items-center gap-3"} ${className}`}
      >
        <Button
          asChild
          variant={stacked ? "outline" : "ghost"}
          size={stacked ? "default" : "sm"}
          className={stacked ? "w-full" : ""}
        >
          <Link href="/signup" onClick={onNavigate}>
            Register
          </Link>
        </Button>
        <Button
          asChild
          size={stacked ? "default" : "sm"}
          className={stacked ? "w-full" : ""}
        >
          <Link href="/login" onClick={onNavigate}>
            Login
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
          aria-label="Open account menu"
        >
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/15 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">{displayName}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {dashboardLinks.map((link) => {
          const Icon = dashboardIcon(link.label);
          return (
            <DropdownMenuItem
              key={link.href}
              onSelect={() => {
                onNavigate?.();
                router.push(link.href);
              }}
            >
              <Icon className="size-4" />
              {link.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuItem
          onSelect={() => {
            onNavigate?.();
            router.push("/userDashboard/settings");
          }}
        >
          <Settings className="size-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile drawer: full-width links mirroring the avatar menu. */
export function HeaderAuthMobileLinks({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { isAuthenticated, isReady, displayName, dashboardLinks, logout } = useAuth();

  if (!isReady) return null;

  if (!isAuthenticated) {
    return (
      <HeaderAuthActions stacked onNavigate={onNavigate} className="w-full" />
    );
  }

  return (
    <div className="space-y-1">
      <p className="px-1 pb-2 text-sm font-medium text-muted-foreground">{displayName}</p>
      {dashboardLinks.map((link) => (
        <button
          key={link.href}
          type="button"
          className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-base font-medium hover:text-primary transition-colors"
          onClick={() => {
            onNavigate?.();
            router.push(link.href);
          }}
        >
          {link.label}
        </button>
      ))}
      <button
        type="button"
        className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-base font-medium hover:text-primary transition-colors"
        onClick={() => {
          onNavigate?.();
          router.push("/userDashboard/settings");
        }}
      >
        Profile Settings
      </button>
      <button
        type="button"
        className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-base font-medium text-destructive hover:text-destructive/90 transition-colors"
        onClick={async () => {
          onNavigate?.();
          await logout();
        }}
      >
        Logout
      </button>
    </div>
  );
}
