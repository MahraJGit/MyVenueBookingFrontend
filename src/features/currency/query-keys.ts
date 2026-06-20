export const currencyKeys = {
  all: ["currency"] as const,
  rates: () => [...currencyKeys.all, "rates"] as const,
};
