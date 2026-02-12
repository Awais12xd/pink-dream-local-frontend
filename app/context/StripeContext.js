"use client";
import { createContext, useContext, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { SettingContext } from "./SettingContext";

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

const StripeContext = createContext();

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error("useStripeContext must be used within a StripeProvider");
  }
  return context;
};

export const StripeProvider = ({ children }) => {
  const value = {
    // Add any stripe-related functions here if needed
  };

  const { settings } = useContext(SettingContext);

  const publishableKey =
    settings?.paymentSettings?.credentialsPublic?.stripe?.publishableKey ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "";

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  return (
    <StripeContext.Provider value={{ publishableKey }}>
      <Elements
        stripe={stripePromise}
        options={{
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#ec4899",
            },
          },
        }}
      >
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};
