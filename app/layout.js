// app/layout.js (simplified)
import { Inter } from "next/font/google";
import { cache } from "react";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastContainer } from "react-toastify";
import SettingsProvider from "./context/SettingContext";
import "react-toastify/dist/ReactToastify.css";
import RouteGuardModal from "./components/RouteGuardModel";
import {
  DEFAULT_THEME_SETTINGS,
  getThemeCssVarString,
} from "./utils/themeTokens";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const FALLBACK_META = {
  title: "Pink Dreams - Premium Fashion Store",
  description: "Discover the latest fashion trends with our premium collection",
  icon: "/favicon.ico",
};

const getPublicSettings = cache(async () => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  if (!apiBase) return null;

  try {
    const res = await fetch(`${apiBase}/settings/public`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.settings || null;
  } catch {
    return null;
  }
});

export async function generateMetadata() {
  const settings = await getPublicSettings();
  const title = settings?.siteTitle || FALLBACK_META.title;
  const description = settings?.siteDescription || FALLBACK_META.description;
  const icon = settings?.branding?.favicon?.url || FALLBACK_META.icon;
  const ogImage = settings?.branding?.siteLogo?.url;
  const metadataBase = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );

  return {
    title,
    description,
    metadataBase,
    icons: {
      icon,
      shortcut: icon,
      apple: icon,
    },
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export async function generateViewport() {
  const settings = await getPublicSettings();
  return {
    themeColor:
      settings?.themeSettings?.brand?.primary ||
      DEFAULT_THEME_SETTINGS.brand.primary,
  };
}

export default async function RootLayout({ children }) {
  const settings = await getPublicSettings();
  const themeCss = getThemeCssVarString(settings?.themeSettings);
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
        {themeCss ? (
          <style
            id="theme-vars"
            dangerouslySetInnerHTML={{ __html: themeCss }}
          />
        ) : null}
      </head>
      <body className={`${inter.variable}`}>
        <SettingsProvider initialSettings={settings}>
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
