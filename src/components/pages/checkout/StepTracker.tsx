"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, CircleCheck, CircleDollarSign, Ticket } from "lucide-react";

interface StepTrackerProps {
  currentStep: number;
}

const StepTracker: React.FC<StepTrackerProps> = ({ currentStep }) => {
  const t = useTranslations("checkout");

  return (
    <div className="flex flex-wrap items-center justify-center py-6 gap-4 md:gap-10 text-sm md:text-base">
      <div
        className={`flex items-center gap-2 p-2.5 ${
          currentStep === 1
            ? "text-[#D7498E] bg-[linear-gradient(0deg,rgba(27,27,27,0)_-22.86%,rgba(215,73,142,0.4)_122.86%)] rounded border border-[#D7498E]"
            : "text-white/70"
        }`}
      >
        <Ticket size={18} />
        <span>{t("trackerTickets")}</span>
      </div>

      <ChevronRight size={20} className="text-white/50 hidden sm:block" />

      <div
        className={`flex items-center gap-2 p-2.5 ${
          currentStep === 2 || currentStep === 3
            ? "text-[#D7498E] bg-[linear-gradient(0deg,rgba(27,27,27,0)_-22.86%,rgba(215,73,142,0.4)_122.86%)] rounded border border-[#D7498E]"
            : "text-white/70"
        }`}
      >
        <CircleDollarSign size={18} />
        <span>{t("trackerPayment")}</span>
      </div>

      <ChevronRight size={20} className="text-white/50 hidden sm:block" />

      <div
        className={`flex items-center gap-2 p-2.5 ${
          currentStep === 4
            ? "text-[#D7498E] bg-[linear-gradient(0deg,rgba(27,27,27,0)_-22.86%,rgba(215,73,142,0.4)_122.86%)] rounded border border-[#D7498E]"
            : "text-white/70"
        }`}
      >
        <CircleCheck size={18} />
        <span>{t("trackerReview")}</span>
      </div>
    </div>
  );
};

export default StepTracker;
