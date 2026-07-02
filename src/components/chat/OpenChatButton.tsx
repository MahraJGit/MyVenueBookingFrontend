"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  getConversationByBooking,
  getConversationByOrderGroup,
} from "@/features/chat/api";
import { toastApiError } from "@/lib/toasts";

type OpenChatButtonProps = {
  kind: "booking" | "ticket";
  referenceId: string;
  messagesPath: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
};

export function OpenChatButton({
  kind,
  referenceId,
  messagesPath,
  disabled,
  variant = "outline",
  size = "sm",
}: OpenChatButtonProps) {
  const t = useTranslations("chat");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () =>
      kind === "booking"
        ? getConversationByBooking(referenceId)
        : getConversationByOrderGroup(referenceId),
    onSuccess: (conversation) => {
      router.push(`${messagesPath}?c=${conversation.id}`);
    },
    onError: (err) => toastApiError(err),
  });

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="mr-2 h-4 w-4" />
      )}
      {t("messageVendor")}
    </Button>
  );
}
