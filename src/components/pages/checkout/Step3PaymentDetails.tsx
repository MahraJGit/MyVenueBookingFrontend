"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { useTranslations } from "next-intl";
import Guarantee from "./Guarantee";
import TimeLeft from "./TimeLeft";

const Step3PaymentDetails = ({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
  paymentDetails?: { cardNumber: string; name: string };
  setPaymentDetails?: React.Dispatch<
    React.SetStateAction<{ cardNumber: string; name: string }>
  >;
}) => {
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const tBooking = useTranslations("booking");

  return (
    <>
      <TimeLeft />
      <section>
        <h2>{t("orderSummary")}</h2>
        <div className="summary bg-[#1B1B1B59] p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center bg-[#1B1B1B] p-2 rounded-[8px]  text-[#B3B3B3]">
            <span>{t("ticketPrice")}</span> <span>2 * $55</span>
          </div>
          <div className="flex justify-between items-center p-2  text-[#B3B3B3]">
            <span>{t("serviceFee")}</span> <span>2 * $65</span>
          </div>
          <div className="flex justify-between items-center bg-[#1B1B1B] p-2 rounded-[8px] text-[#B3B3B3]">
            <span>{tBooking("tax")}</span> <span>2 * $10</span>
          </div>
          <div className="flex justify-between items-center p-2">
            <span>{t("totalPrice")}</span> <span>$260</span>
          </div>
        </div>
      </section>
      <section className="payment-details rounded-2xl text-white">
        <h2 className="text-xl font-semibold mb-6">{t("cardDetails")}</h2>

        <form className="space-y-4 p-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="card-number" className="text-sm text-gray-300 ">
              {t("cardNumber")}
            </label>
            <Input
              id="card-number"
              type="text"
              className="bg-[#1a1a1a] border-none text-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="card-holder" className="text-sm text-gray-300">
              {t("cardHolder")}
            </label>
            <Input
              id="card-holder"
              type="text"
              className="bg-[#1a1a1a] border-none text-white placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="expiry" className="text-sm text-gray-300">
                {t("expiry")}
              </label>
              <Input
                id="expiry"
                type="text"
                className="bg-[#1a1a1a] border-none text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="cvv" className="text-sm text-gray-300">
                {t("cvv")}
              </label>
              <Input
                id="cvv"
                type="text"
                className="bg-[#1a1a1a] border-none text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </form>
      </section>

      <div className="flex gap-2 my-6 p-4">
        <Button className="w-1/2" variant="outline" onClick={onBack}>
          {tCommon("back")}
        </Button>
        <Button className="w-1/2" onClick={onNext}>
          {t("reviewOrder")}
        </Button>
      </div>
      <Guarantee />
    </>
  );
};

export default Step3PaymentDetails;
