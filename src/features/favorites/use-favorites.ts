"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { getFavoriteIds, toggleFavorite } from "@/features/favorites/api";
import { favoriteKeys } from "@/features/favorites/query-keys";
import type { FavoriteIds, FavoritableType } from "@/features/favorites/types";
import { toastApiError } from "@/lib/toasts";

const EMPTY_IDS: FavoriteIds = { eventIds: [], venueIds: [] };

export function useFavoriteIds() {
  const { isAuthenticated, isReady } = useAuth();

  return useQuery({
    queryKey: favoriteKeys.ids(),
    queryFn: getFavoriteIds,
    enabled: isAuthenticated && isReady,
    staleTime: 30_000,
  });
}

export function useIsFavorited(type: FavoritableType, id: string) {
  const { data } = useFavoriteIds();
  const ids = data ?? EMPTY_IDS;
  return type === "event" ? ids.eventIds.includes(id) : ids.venueIds.includes(id);
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      id,
    }: {
      type: FavoritableType;
      id: string;
    }) => toggleFavorite(type, id),
    onMutate: async ({ type, id }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.ids() });
      const previous = queryClient.getQueryData<FavoriteIds>(favoriteKeys.ids());

      queryClient.setQueryData<FavoriteIds>(favoriteKeys.ids(), (current) => {
        const base = current ?? EMPTY_IDS;
        const key = type === "event" ? "eventIds" : "venueIds";
        const isFavorited = base[key].includes(id);
        return {
          ...base,
          [key]: isFavorited
            ? base[key].filter((item) => item !== id)
            : [...base[key], id],
        };
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoriteKeys.ids(), context.previous);
      }
      toastApiError(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}
