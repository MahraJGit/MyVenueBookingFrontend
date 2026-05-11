import { Suspense } from "react";
import { VerifyOtpForm } from "./verify-otp-form";

function VerifyOtpFallback() {
  return (
    <section className="verify-otp">
      <div className="flex flex-col items-center justify-center text-white px-4 py-24">
        <p className="text-gray-400 text-sm">Loading verification…</p>
      </div>
    </section>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpFallback />}>
      <VerifyOtpForm />
    </Suspense>
  );
}
