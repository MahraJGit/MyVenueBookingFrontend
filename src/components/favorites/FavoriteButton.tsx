"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth-context";
import type { FavoritableType } from "@/features/favorites/types";
import {
  useIsFavorited,
  useToggleFavorite,
} from "@/features/favorites/use-favorites";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  type: FavoritableType;
  id: string;
  className?: string;
};

export function FavoriteButton({ type, id, className }: FavoriteButtonProps) {
  const pathname = usePathname();
  const t = useTranslations("favorites");
  const { isAuthenticated, isReady } = useAuth();
  const isFavorited = useIsFavorited(type, id);
  const toggleMutation = useToggleFavorite();
  const [loginOpen, setLoginOpen] = useState(false);

  const redirect = encodeURIComponent(pathname);
  const loginUrl = `/login?redirect=${redirect}`;
  const signupUrl = `/signup?redirect=${redirect}`;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isReady) return;

    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    toggleMutation.mutate({ type, id });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={toggleMutation.isPending}
        aria-pressed={isFavorited}
        aria-label={
          isFavorited ? t("removeFromFavourites") : t("addToFavourites")
        }
        className={cn(
          "flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70",
          isFavorited && "border-primary/40 bg-primary/20 text-primary",
          className,
        )}
      >
        <Heart
          className={cn("size-4", isFavorited && "fill-current")}
          aria-hidden
        />
      </button>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("loginRequiredTitle")}</DialogTitle>
            <DialogDescription>{t("loginRequiredDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button asChild variant="outline">
              <Link href={signupUrl}>{t("signup")}</Link>
            </Button>
            <Button asChild>
              <Link href={loginUrl}>{t("login")}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
