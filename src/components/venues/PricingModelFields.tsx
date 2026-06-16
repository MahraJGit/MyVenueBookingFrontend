"use client";

import type { PricingModel, Currency } from "@/features/venues/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const CURRENCIES: Currency[] = ["AED", "PKR", "USD", "EUR", "GBP", "SAR", "QAR"];

export type PricingFormState = {
  modelType: PricingModel;
  basePrice: number;
  currency: Currency;
  taxRate: number;
  config: Record<string, unknown>;
};

type PricingModelFieldsProps = {
  value: PricingFormState;
  onChange: (value: PricingFormState) => void;
};

export function defaultPricingForm(model: PricingModel = "HOURLY"): PricingFormState {
  const configs: Record<PricingModel, Record<string, unknown>> = {
    HOURLY: { slotDurationMinutes: 60, bufferMinutes: 15, minBookingSlots: 1 },
    NAMED_SLOTS: { slots: [{ name: "Morning", startTime: "09:00", endTime: "13:00", price: 500 }], bufferMinutes: 0 },
    DAILY_BLOCK: { pricePerDay: 1000, minBookingDays: 1 },
    FLAT_RATE: {},
  };
  return {
    modelType: model,
    basePrice: 100,
    currency: "AED",
    taxRate: 5,
    config: configs[model],
  };
}

export function PricingModelFields({ value, onChange }: PricingModelFieldsProps) {
  const set = (patch: Partial<PricingFormState>) => onChange({ ...value, ...patch });

  const setConfig = (key: string, val: unknown) =>
    onChange({ ...value, config: { ...value.config, [key]: val } });

  const slots = (value.config.slots as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Pricing model</Label>
          <Select
            value={value.modelType}
            onValueChange={(v) => {
              const model = v as PricingModel;
              onChange(defaultPricingForm(model));
            }}
          >
            <SelectTrigger className="border-[#303030] bg-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOURLY">Hourly</SelectItem>
              <SelectItem value="NAMED_SLOTS">Named slots</SelectItem>
              <SelectItem value="DAILY_BLOCK">Daily block</SelectItem>
              <SelectItem value="FLAT_RATE">Flat rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={value.currency}
            onValueChange={(v) => set({ currency: v as Currency })}
          >
            <SelectTrigger className="border-[#303030] bg-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Base price</Label>
          <Input
            type="number"
            min={0}
            value={value.basePrice}
            onChange={(e) => set({ basePrice: Number(e.target.value) })}
            className="border-[#303030] bg-black"
          />
        </div>
        <div className="space-y-2">
          <Label>Tax rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={value.taxRate}
            onChange={(e) => set({ taxRate: Number(e.target.value) })}
            className="border-[#303030] bg-black"
          />
        </div>
      </div>

      {value.modelType === "HOURLY" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Slot duration (min)</Label>
            <Input type="number" min={30} value={Number(value.config.slotDurationMinutes) || 60} onChange={(e) => setConfig("slotDurationMinutes", Number(e.target.value))} className="border-[#303030] bg-black" />
          </div>
          <div className="space-y-2">
            <Label>Buffer (min)</Label>
            <Input type="number" min={0} value={Number(value.config.bufferMinutes) || 0} onChange={(e) => setConfig("bufferMinutes", Number(e.target.value))} className="border-[#303030] bg-black" />
          </div>
          <div className="space-y-2">
            <Label>Min slots</Label>
            <Input type="number" min={1} value={Number(value.config.minBookingSlots) || 1} onChange={(e) => setConfig("minBookingSlots", Number(e.target.value))} className="border-[#303030] bg-black" />
          </div>
        </div>
      )}

      {value.modelType === "DAILY_BLOCK" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Price per day</Label>
            <Input type="number" min={0} value={Number(value.config.pricePerDay) || 0} onChange={(e) => setConfig("pricePerDay", Number(e.target.value))} className="border-[#303030] bg-black" />
          </div>
          <div className="space-y-2">
            <Label>Min days</Label>
            <Input type="number" min={1} value={Number(value.config.minBookingDays) || 1} onChange={(e) => setConfig("minBookingDays", Number(e.target.value))} className="border-[#303030] bg-black" />
          </div>
        </div>
      )}

      {value.modelType === "NAMED_SLOTS" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Named slots</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[#303030]"
              onClick={() =>
                setConfig("slots", [
                  ...slots,
                  { name: "Slot", startTime: "09:00", endTime: "12:00", price: value.basePrice },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add slot
            </Button>
          </div>
          {slots.map((slot, idx) => (
            <div key={idx} className="grid gap-2 rounded-lg border border-[#303030] p-3 sm:grid-cols-5">
              <Input placeholder="Name" value={String(slot.name ?? "")} onChange={(e) => {
                const next = [...slots];
                next[idx] = { ...next[idx], name: e.target.value };
                setConfig("slots", next);
              }} className="border-[#303030] bg-black sm:col-span-2" />
              <Input placeholder="Start HH:mm" value={String(slot.startTime ?? "")} onChange={(e) => {
                const next = [...slots];
                next[idx] = { ...next[idx], startTime: e.target.value };
                setConfig("slots", next);
              }} className="border-[#303030] bg-black" />
              <Input placeholder="End HH:mm" value={String(slot.endTime ?? "")} onChange={(e) => {
                const next = [...slots];
                next[idx] = { ...next[idx], endTime: e.target.value };
                setConfig("slots", next);
              }} className="border-[#303030] bg-black" />
              <div className="flex gap-2">
                <Input type="number" placeholder="Price" value={Number(slot.price) || 0} onChange={(e) => {
                  const next = [...slots];
                  next[idx] = { ...next[idx], price: Number(e.target.value) };
                  setConfig("slots", next);
                }} className="border-[#303030] bg-black" />
                <Button type="button" size="icon" variant="ghost" onClick={() => setConfig("slots", slots.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
