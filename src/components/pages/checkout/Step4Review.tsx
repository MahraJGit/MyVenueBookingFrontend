import { Button } from "@/components/ui/button";
import React from "react";
import { CircleUser, Phone, Mail, CircleDollarSign } from 'lucide-react';
import "@/styles/checkout.css";
import Guarantee from "./Guarantee";
import TimeLeft from "./TimeLeft";

const Step4Review = ({ onBack, onPay }: any) => {
  return (
    <>
      <TimeLeft />
      <section className="review-order flex flex-col gap-4 gradient-border-left">
        <p className="flex items-center gap-2"><CircleUser size={24} />Negar khosravi</p>
        <p className="flex items-center gap-2"><Phone size={24} /> 785423349</p>
        <p className="flex items-center gap-2"><Mail size={24} /> negarkhosravi1995@gmail.com</p>
        <p className="flex items-center gap-2"><CircleDollarSign size={24} />Total price : $260</p>
      </section>

      <div className="flex gap-4 my-6">
        <Button variant="secondary" size="lg" className="px-14" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onPay} className="px-14">Pay</Button>
      </div>
      <Guarantee />
    </>
  );
};

export default Step4Review;
