// app/layout.js (simplified)
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastContainer } from "react-toastify";
import SettingsProvider from "./context/SettingContext";
import "react-toastify/dist/ReactToastify.css";
import RouteGuardModal from "./components/RouteGuardModel";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
});

export const metadata = {
  title: "Pink Dreams - Premium Fashion Store",
  description: "Discover the latest fashion trends with our premium collection",
};

export default function RootLayout({ children }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  let apiOrigin = "";

  try {
    apiOrigin = apiUrl ? new URL(apiUrl).origin : "";
  } catch {
    apiOrigin = "";
  }

  // DO NOT fetch settings here (build-time). Let client fetch.
  return (
    <html lang="en">
      <head>
        {apiOrigin ? (
          <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
        ) : null}
      </head>
      <body className={`${inter.variable} ${merriweather.variable}`}>
        <SettingsProvider initialSettings={null}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ToastContainer
                  theme="colored"
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
                <RouteGuardModal>{children}</RouteGuardModal>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
