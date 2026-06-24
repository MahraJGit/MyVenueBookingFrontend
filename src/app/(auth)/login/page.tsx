import { Suspense } from "react";
import { LoadingFallback } from "@/components/i18n/LoadingFallback";
import LoginPageContent from "./LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
