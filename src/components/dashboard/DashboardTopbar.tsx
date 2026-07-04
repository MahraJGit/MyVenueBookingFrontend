"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeaderAuthActions } from "@/components/common/HeaderAuthActions";
import { CurrencySelect } from "@/components/currency/CurrencySelect";
import { LanguageSelect } from "@/components/i18n/LanguageSelect";
import NotificationBell from "@/components/notifications/NotificationBell";
import {
  dashboardInputClass,
  dashboardSurfaceClass,
} from "@/components/dashboard/dashboard-ui";
import { cn } from "@/lib/utils";

const controlTriggerClass =
  "border-[#303030]/80 bg-[#151515] backdrop-blur-sm";

type DashboardTopbarProps = {
  onMenuClick?: () => void;
  /** When set, shows a search field on the left (user dashboard). */
  searchPlaceholder?: string;
  /** When set, shows the notification bell. */
  notificationsHref?: string;
  notificationsVariant?: "user" | "admin";
  className?: string;
};

/**
 * Shared chrome for user / vendor / admin dashboards:
 * language, currency, optional notifications, and profile menu.
 */
export function DashboardTopbar({
  onMenuClick,
  searchPlaceholder,
  notificationsHref,
  notificationsVariant = "user",
  className,
}: DashboardTopbarProps) {
  const tCommon = useTranslations("common");

  return (
    <header
      className={cn(
        dashboardSurfaceClass,
        "mb-4 flex flex-col gap-3 p-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onMenuClick ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={onMenuClick}
            aria-label={tCommon("toggleMenu")}
          >
            <Menu className="text-white" />
          </Button>
        ) : null}

        {searchPlaceholder ? (
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <Input
              placeholder={searchPlaceholder}
              className={cn(dashboardInputClass, "w-full")}
              aria-label={searchPlaceholder}
            />
          </div>
        ) : (
          <span className="hidden text-sm font-medium text-white/80 lg:inline">
            {tCommon("appName")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <LanguageSelect
          triggerClassName={cn("size-9", controlTriggerClass)}
        />
        <CurrencySelect
          triggerClassName={cn(
            "h-9 gap-1.5 rounded-full px-2.5",
            controlTriggerClass,
          )}
        />
        {notificationsHref ? (
          <NotificationBell
            href={notificationsHref}
            variant={notificationsVariant}
          />
        ) : null}
        <HeaderAuthActions />
      </div>
    </header>
  );
}
