"use client";

import { CircleDollarSign, ShieldCheck } from "lucide-react";
import React from "react";
import { useTranslations } from "next-intl";

const Guarantee = () => {
  const t = useTranslations("checkout");

  return (
    <div className="Guarantee space-y-3 bg-[#1B1B1B59] p-6 rounded-lg border border-[#99999933]">
      <p className="flex items-center gap-2">
        <ShieldCheck size={24} className="text-primary shrink-0" />
        {t("fanProtect")}
      </p>

      <p className="flex items-center gap-2">
        <CircleDollarSign size={24} className="text-primary shrink-0" />
        {t("easyRefund")}
      </p>

      <p className="ml-8 text-[#999999]">{t("refundPolicy")}</p>
    </div>
  );
};

export default Guarantee;
