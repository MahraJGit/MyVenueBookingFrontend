"use client";

import React from "react";
import { useTranslations } from "next-intl";

const TimeLeft = () => {
  const t = useTranslations("checkout");

  return (
    <section className="timeLeft mb-6">
      <div className="flex items-center gap-4">
        <div className="time flex items-center gap-2">
          <div className="flex items-center gap-2 ">
            <span className="bg-[linear-gradient(360deg,rgba(26,26,26,0.5)_41.28%,#262626_52.11%)] px-4 py-1.5 border-#1F1F1F border rounded">
              0
            </span>
            <span className="bg-[linear-gradient(360deg,rgba(26,26,26,0.5)_41.28%,#262626_52.11%)] px-4 py-1.5 border-#1F1F1F border rounded">
              9
            </span>
          </div>
          <span className="">:</span>
          <div className="flex items-center gap-2 ">
            <span className="bg-[linear-gradient(360deg,rgba(26,26,26,0.5)_41.28%,#262626_52.11%)] px-4 py-1.5 border-#1F1F1F border rounded">
              4
            </span>
            <span className="bg-[linear-gradient(360deg,rgba(26,26,26,0.5)_41.28%,#262626_52.11%)] px-4 py-1.5 border-#1F1F1F border rounded">
              3
            </span>
          </div>
        </div>
        <div className="timeLeft-text">
          <p className="text-[#B3B3B3]">{t("timeLeftComplete")}</p>
          <span className="text-xs text-[#999999]">{t("priceGuaranteed")}</span>
        </div>
      </div>
    </section>
  );
};

export default TimeLeft;
