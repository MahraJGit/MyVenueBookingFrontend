"use client";

import Image from "next/image";
import React, { useState } from "react";
import Step1Confirm from "@/components/pages/checkout/Step1Confirm";
import Step2PaymentMethod from "@/components/pages/checkout/Step2PaymentMethod";
import Step3PaymentDetails from "@/components/pages/checkout/Step3PaymentDetails";
import Step4Review from "@/components/pages/checkout/Step4Review";
import ThankYouOverlay from "@/components/pages/checkout/ThankYouOverlay";
import StepTracker from "@/components/pages/checkout/StepTracker";

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    name: "",
  });
  const [showThankYou, setShowThankYou] = useState(false);

  // Step navigation
  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handleBack = () => setCurrentStep((prev) => prev - 1);

  // Final step
  const handlePay = () => setShowThankYou(true);
  const handleCloseThankYou = () => {
    setShowThankYou(false);
    setCurrentStep(1);
  };

  return (
    <section className="checkout-hero py-10">
      <div className="container mx-auto px-4">
        <div className="inner">
          {/* ✅ Use StepTracker Component */}
          <StepTracker currentStep={currentStep} />

          <div className="min-h-screen flex flex-col lg:flex-row items-start lg:items-center gap-10">
            {/* Left side - venue info */}
            <div className="w-full lg:w-1/2 px-2 sm:px-4">
              <div className="venue-card max-w-lg mx-auto">
                <div className="venue-img h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] relative rounded-2xl overflow-hidden">
                  <Image
                    src="/images/venue.jpg"
                    alt="event"
                    fill
                    className="object-cover rounded-2xl"
                  />
                </div>
                <div className="venue-content -mt-6 sm:-mt-8 mx-2 sm:mx-4 bg-[#1B1B1BF2] p-4 sm:p-6 rounded-2xl relative z-10 text-white">
                  <h4 className="text-lg sm:text-xl font-semibold">Adel</h4>
                  <div className="flex flex-col text-[#999999] gap-1 mt-2 text-sm">
                    <span className="flex items-center">Tue 30 Sep <span className="mx-1">•</span> 7:30 PM</span>
                    <span className="font-normal">Fontainbleau</span>
                    <span className="text-xs">Las Vegas, Nevada, USA</span>
                  </div>
                  <div className="venue-footer mt-6 flex flex-col gap-2 text-sm">
                    <p className="flex items-center gap-2">
                      Section <span className="mx-1">•</span> Vip Row 7 <span className="mx-1">•</span> Seats 07-08
                    </p>
                    <span className="flex items-center gap-2 text-xs text-[#4CAF50]">
                      2 tickets <span className="mx-1">•</span> Seated together
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - checkout steps */}
            <div className="w-full lg:w-1/2 px-2 sm:px-4">
              <div className="max-w-lg mx-auto w-full">
                {currentStep === 1 && <Step1Confirm onNext={handleNext} />}
                {currentStep === 2 && (
                  <Step2PaymentMethod
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 3 && (
                  <Step3PaymentDetails
                    paymentDetails={paymentDetails}
                    setPaymentDetails={setPaymentDetails}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Review onBack={handleBack} onPay={handlePay} />
                )}
                {showThankYou && <ThankYouOverlay onClose={handleCloseThankYou} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
  