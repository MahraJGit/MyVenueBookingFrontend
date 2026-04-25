import { Button } from "@/components/ui/button";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShieldCheck, CircleDollarSign } from 'lucide-react';
import Guarantee from "./Guarantee";
import TimeLeft from "./TimeLeft";

const Step1Confirm = ({ onNext }: any) => {
  return (
    <>
    <TimeLeft />
      <section className="space-y-4">
        <p>Make sure the number of tickets is correct before proceeding.</p>
        <div className="flex justify-between items-center">
          <p>Ticket quantity</p>
          <Select defaultValue="2">
            <SelectTrigger className="w-[60px]">
              <SelectValue placeholder="Select a number" />
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
        <Button className="w-full my-6" onClick={onNext}>Confirm</Button>
      </section>
      <Guarantee />
    </>
  );
};

export default Step1Confirm;
