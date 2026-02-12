"use client";
import { createContext, useContext, useMemo } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { SettingContext } from "./SettingContext";

const PayPalContext = createContext({ clientId: "", ready: false });

export const PayPalProvider = ({ children }) => {
  const { settings } = useContext(SettingContext);

  const clientId =
    settings?.paymentSettings?.credentialsPublic?.paypal?.clientId || "";

  // Hook must always run (before any conditional return)
  const options = useMemo(
    () => ({
      "client-id": clientId,
      currency: "USD",
      intent: "capture",
      components: "buttons,messages",
      commit: true,
    }),
    [clientId],
  );

  if (!clientId) {
    return (
      <PayPalContext.Provider value={{ clientId: "", ready: false }}>
        {children}
      </PayPalContext.Provider>
    );
  }

  return (
    <PayPalContext.Provider value={{ clientId, ready: true }}>
      <PayPalScriptProvider options={options}>
        {children}
      </PayPalScriptProvider>
    </PayPalContext.Provider>
  );
};

export const usePayPal = () => useContext(PayPalContext);
