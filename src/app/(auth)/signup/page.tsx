import { Suspense } from "react";
import { LoadingFallback } from "@/components/i18n/LoadingFallback";
import SignupPageContent from "./SignupPageContent";

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupPageContent />
    </Suspense>
  );
}
