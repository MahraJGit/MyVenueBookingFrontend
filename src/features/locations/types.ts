import type { Currency } from "@/features/venues/types";

export type Country = {
  id: string;
  code: string;
  name: string;
  phoneCode?: string | null;
  defaultCurrency?: Currency | null;
  defaultTimezone?: string | null;
  isActive: boolean;
};

export type City = {
  id: string;
  countryId: string;
  name: string;
  timezone?: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

export type CountryPayload = {
  code: string;
  name: string;
  phoneCode?: string;
  defaultCurrency?: Currency;
  defaultTimezone?: string;
  isActive?: boolean;
};

export type CityPayload = {
  countryCode: string;
  name: string;
  timezone: string;
  isFeatured?: boolean;
  isActive?: boolean;
};
