import { Suspense } from "react";
import { LoadingFallback } from "@/components/i18n/LoadingFallback";
import { VerifyOtpForm } from "./verify-otp-form";

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <section className="verify-otp">
          <div className="flex flex-col items-center justify-center px-4 py-24 text-white">
            <LoadingFallback
              className="text-sm text-gray-400"
              message="loadingVerification"
            />
          </div>
        </section>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
