"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Guarantee from "./Guarantee";
import TimeLeft from "./TimeLeft";

const Step1Confirm = ({ onNext }: { onNext: () => void }) => {
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");

  return (
    <>
      <TimeLeft />
      <section className="space-y-4">
        <p>{t("confirmTicketsHint")}</p>
        <div className="flex justify-between items-center">
          <p>{t("ticketQuantity")}</p>
          <Select defaultValue="2">
            <SelectTrigger className="w-[60px]">
              <SelectValue placeholder={t("selectNumber")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full my-6" onClick={onNext}>
          {tCommon("confirm")}
        </Button>
      </section>
      <Guarantee />
    </>
  );
};

export default Step1Confirm;
