// app/layout.js (simplified)
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastContainer } from "react-toastify";
import { StripeProvider } from "./context/StripeContext";
import { PayPalProvider } from "./context/PayPalContext";
import SettingsProvider from "./context/SettingContext";
import "react-toastify/dist/ReactToastify.css";
import { NotificationProvider } from "./context/NotificationContext";

const inter = Inter({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-inter", display: "swap"});
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400","700"], variable: "--font-merriweather", display: "swap" });

export const metadata = {
  title: "Pink Dreams - Premium Fashion Store",
  description: "Discover the latest fashion trends with our premium collection",
};

export default function RootLayout({ children }) {
  // DO NOT fetch settings here (build-time). Let client fetch.
  return (
    <html lang="en">
      <head />
      <body className={`${inter.variable} ${merriweather.variable}`}>
        <NotificationProvider>
        <SettingsProvider initialSettings={null}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <StripeProvider>
                  <PayPalProvider>
                    <ToastContainer
                      position="top-right"
                      autoClose={3000}
                      hideProgressBar={false}
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                    />
                    {children}
                  </PayPalProvider>
                </StripeProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
