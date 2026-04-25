"use client";

import React from "react";
import { ChevronRight, CircleCheck, CircleDollarSign, Ticket } from "lucide-react";

interface StepTrackerProps {
  currentStep: number;
}

const StepTracker: React.FC<StepTrackerProps> = ({ currentStep }) => {
  return (
    <div className="flex flex-wrap items-center justify-center py-6 gap-4 md:gap-10 text-sm md:text-base">
      {/* Step 1 - Tickets */}
      <div
        className={`flex items-center gap-2 p-2.5 ${
          currentStep === 1 ? "text-[#D7498E] bg-[linear-gradient(0deg,rgba(27,27,27,0)_-22.86%,rgba(215,73,142,0.4)_122.86%)] rounded border border-[#D7498E]" : "text-white/70"
        }`}
      >
        <Ticket size={18} />
        <span>Tickets</span>
      </div>

      <ChevronRight
        size={20}
        className="text-white/50 hidden sm:block"
      />

      {/* Step 2 - Payment */}
      <div
        className={`flex items-center gap-2 p-2.5 ${
          currentStep === 2 || currentStep === 3
            ? "text-[#D7498E] bg-[linear-gradient(0deg,rgba(27,27,27,0)_-22.86%,rgba(215,73,142,0.4)_122.86%)] rounded border border-[#D7498E]"
            : "text-white/70"
        }`}
      >
        <CircleDollarSign size={18} />
        <span>Payment</span>
      </div>

      <ChevronRight
        size={20}
        className="text-white/50 hidden sm:block"
      />

      {/* Step 3 - Review */}
      <div
        className={`flex items-center gap-2 p-2.5 ${
          currentStep === 4 ? "text-[#D7498E] bg-[linear-gradient(0deg,rgba(27,27,27,0)_-22.86%,rgba(215,73,142,0.4)_122.86%)] rounded border border-[#D7498E]" : "text-white/70"
        }`}
      >
        <CircleCheck size={18} />
        <span>Review</span>
      </div>
    </div>
  );
};

export default StepTracker;
