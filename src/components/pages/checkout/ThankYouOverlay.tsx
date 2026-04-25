import React from "react";
import { Button } from "@/components/ui/button";
import { SquareChevronLeft, SquareChevronRight } from "lucide-react";
import "@/styles/checkout.css";

const ThankYouOverlay = ({ onClose }: any) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 thanku-overlay">
      <div className=" p-8 rounded-2xl text-center w-[90%] max-w-[400px] text-white animate-fadeIn">
        <h2 className="text-3xl font-semibold mb-2">Thank You!</h2>
        <p className="text-gray-300">Your payment was successful.</p>
        <p className="text-gray-400 mt-2">Your tickets have been sent to:</p>
        <p className="font-medium text-[#D7498E] mt-1">
          negarkhosravi1995@gmail.com
        </p>

        <div className="flex justify-center gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex items-center gap-2 px-12! py-2 text-sm"
            onClick={onClose}
          >
            <SquareChevronLeft size={24} />
            Back
          </Button>

          <Button className="flex items-center gap-2 px-12! py-2 bg-[#D7498E] hover:bg-[#c13f80] text-sm">
            Go to Profile
            <SquareChevronRight size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouOverlay;
