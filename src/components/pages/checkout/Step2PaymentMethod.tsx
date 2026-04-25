import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import React from "react";
import Guarantee from "./Guarantee";
import TimeLeft from "./TimeLeft";

const Step2PaymentMethod = ({
  paymentMethod,
  setPaymentMethod,
  onNext,
  onBack,
}: any) => {
  return (
    <>
    <TimeLeft />
      <h2 className="font-semibold mb-4">Select Payment Method</h2>
      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
        <div className="flex items-center space-x-4 bg-[#121212] p-4 rounded-lg mb-1">
          <RadioGroupItem value="paypal" id="paypal" />
          <label className="flex items-center gap-2" htmlFor="paypal">
            <Image
              src="/svg/paypal.svg"
              alt="paypal logo"
              width={35}
              height={25}
            />
            PayPal
          </label>
        </div>
        <div className="flex items-center space-x-4 bg-[#121212] p-4 rounded-lg mb-1">
          <RadioGroupItem value="stripe" id="stripe" />
          <label className="flex items-center gap-2" htmlFor="stripe">
            <Image
              src="/svg/stripe.svg"
              alt="paypal logo"
              width={35}
              height={25}
            />
            Stripe
          </label>
        </div>
        <div className="flex items-center space-x-4 bg-[#121212] p-4 rounded-lg mb-1">
          <RadioGroupItem value="bitpay" id="bitpay" />
          <label className="flex items-center gap-2" htmlFor="bitpay">
            <Image
              src="/svg/bitpay.svg"
              alt="paypal logo"
              width={35}
              height={25}
            />
            bitpay
          </label>
        </div>
        <div className="flex items-center space-x-4 bg-[#121212] p-4 rounded-lg mb-1">
          <RadioGroupItem value="visa" id="visa" />
          <label className="flex items-center gap-2" htmlFor="visa">
            <Image
              src="/svg/visa.svg"
              alt="paypal logo"
              width={35}
              height={25}
            />
            visa
          </label>
        </div>
      </RadioGroup>

      <div className="flex my-6 gap-2">
        <Button className="w-1/2" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button className="w-1/2" disabled={!paymentMethod} onClick={onNext}>
          Confirm
        </Button>
      </div>
      <Guarantee />
    </>
  );
};

export default Step2PaymentMethod;
