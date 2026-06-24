"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type DashboardTabItem<T extends string> = {
  value: T;
  label: ReactNode;
};

type DashboardScrollableTabsProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  items: DashboardTabItem<T>[];
  variant?: "underline" | "pill";
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
};

export function DashboardScrollableTabs<T extends string>({
  value,
  onValueChange,
  items,
  variant = "underline",
  className,
  listClassName,
  triggerClassName,
}: DashboardScrollableTabsProps<T>) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className={cn("w-full min-w-0 max-w-full", className)}
    >
      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList
          className={cn(
            "inline-flex h-auto w-max min-w-full flex-nowrap items-center justify-start gap-2 bg-transparent p-0 sm:gap-4",
            listClassName,
          )}
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={cn(
                "h-auto shrink-0 flex-none whitespace-nowrap px-2 py-2 text-sm shadow-none",
                variant === "underline"
                  ? "rounded-none pb-3 text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white"
                  : "rounded-lg border border-transparent px-3 text-muted-foreground data-[state=active]:border-zinc-700 data-[state=active]:bg-zinc-900 data-[state=active]:text-white",
                triggerClassName,
              )}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}

type DashboardFilterBarProps = {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function DashboardFilterBar({
  children,
  action,
  className,
}: DashboardFilterBarProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 w-full flex-1">{children}</div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}
