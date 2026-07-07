import { cn } from "@/lib/utils";

const navLinkTypographyClass =
  "text-xs font-medium whitespace-nowrap xl:text-[13px]";

const navLinkShapeClass = "rounded-full px-2 py-1.5 transition-colors xl:px-2.5";

export const navLinkActiveVisualClass = cn(
  navLinkShapeClass,
  "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(215,73,142,0.25)]",
);

const mobileNavLinkTypographyClass = "text-[15px] font-medium";

const mobileNavLinkShapeClass =
  "flex items-center justify-center rounded-xl px-3 py-3 transition-colors";

export const mobileNavLinkActiveVisualClass = cn(
  mobileNavLinkShapeClass,
  "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(215,73,142,0.2)]",
);

export function navLinkClass(isActive: boolean) {
  return cn(
    navLinkShapeClass,
    navLinkTypographyClass,
    isActive
      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(215,73,142,0.25)]"
      : "text-foreground/75 hover:bg-white/5 hover:text-primary",
  );
}

export function mobileNavLinkClass(isActive: boolean) {
  return cn(
    mobileNavLinkShapeClass,
    mobileNavLinkTypographyClass,
    isActive
      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(215,73,142,0.2)]"
      : "text-foreground/90 hover:bg-white/5 hover:text-primary",
  );
}

export function navDropdownItemClass(isActive: boolean) {
  return cn(
    navLinkTypographyClass,
    "rounded-md px-2.5 py-1.5 transition-colors",
    "hover:bg-white/5 hover:text-primary focus:bg-white/5 focus:text-primary data-[highlighted]:bg-white/5 data-[highlighted]:text-primary",
    isActive
      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(215,73,142,0.25)]"
      : "text-foreground/75",
  );
}
