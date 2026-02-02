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

const PUBLIC_SETTINGS_ENDPOINT =
  (process.env.NEXT_PUBLIC_API_URL || "") + "/settings/public";

export default async function RootLayout({ children }) {
  let settings = null;
  try {
    const res = await fetch(PUBLIC_SETTINGS_ENDPOINT, {
      cache : "no-store"
    });

    if (res.ok) {
      const json = await res.json();
      settings = json?.settings || null;
      console.log(settings , "Settings in layout")
    } else {
      // non-200 - fallback to null
      console.warn("Public settings fetch failed:", res.status);
      settings = null;
    }
  } catch (err) {
    console.error("Failed to fetch public settings:", err);
    settings = null;
  }

  // Safe fallbacks
  const siteTitle = settings?.seo?.siteTitle || metadata.title;
  const siteDescription =
    settings?.seo?.siteDescription || metadata.description;
  const faviconUrl = settings?.branding?.favicon?.url || "/favicon.ico";

  return (
    <html lang="en">
      <head>
        {/* Dynamic meta and favicon */}
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <link rel="icon" href={faviconUrl} />
        {/* optional extra icons */}
        <link rel="apple-touch-icon" href={faviconUrl} />
        {/* Open Graph defaults */}
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta
          property="og:image"
          content={settings?.branding?.siteLogo?.url || ""}
        />
      </head>

      <body className={`${inter.variable} ${merriweather.variable}`}>
        <SettingsProvider initialSettings={settings}>
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
      </body>
    </html>
  );
}
