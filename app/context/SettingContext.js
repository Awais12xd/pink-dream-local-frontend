// app/context/SettingContext.js
"use client";

import React, { createContext, useEffect, useState } from "react";

export const SettingContext = createContext({
  settings: null,
  setSettings: () => {},
});

const SETTINGS_CACHE_KEY = "public_settings_cache_v1";
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

function setHeadFromSettings(settings) {
  if (!settings) return;

  const siteTitle = settings?.siteTitle || document.title;
  const siteDescription =
    settings?.siteDescription ||
    document.querySelector('meta[name="description"]')?.getAttribute("content") ||
    "";
  const faviconUrl = settings?.branding?.favicon?.url || "/favicon.ico";
  const ogImage = settings?.branding?.siteLogo?.url || "";

  document.title = siteTitle;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute("content", siteDescription);

  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute("content", siteTitle);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement("meta");
    ogDesc.setAttribute("property", "og:description");
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute("content", siteDescription);

  let ogImageEl = document.querySelector('meta[property="og:image"]');
  if (!ogImageEl) {
    ogImageEl = document.createElement("meta");
    ogImageEl.setAttribute("property", "og:image");
    document.head.appendChild(ogImageEl);
  }
  ogImageEl.setAttribute("content", ogImage);

  if (faviconUrl) {
    const existingIcons = document.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
    );
    existingIcons.forEach((i) => i.parentNode?.removeChild(i));

    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = faviconUrl;
    document.head.appendChild(icon);

    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = faviconUrl;
    document.head.appendChild(apple);
  }
}

function readSettingsCache() {
  try {
    const raw = sessionStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > SETTINGS_CACHE_TTL_MS) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

function writeSettingsCache(data) {
  try {
    sessionStorage.setItem(
      SETTINGS_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    // Ignore storage write failures.
  }
}

export default function SettingsProvider({ initialSettings = null, children }) {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    if (initialSettings) {
      setHeadFromSettings(initialSettings);
      setSettings(initialSettings);
      return;
    }

    let mounted = true;
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL || ""}/settings/public`;

    const cached = readSettingsCache();
    if (cached) {
      setSettings(cached);
      setHeadFromSettings(cached);
    }

    async function load() {
      try {
        const res = await fetch(endpoint);
        if (!mounted) return;

        if (!res?.ok) {
          if (!cached) setSettings(null);
          return;
        }

        const json = await res.json();
        const s = json?.settings || null;
        setSettings(s);
        setHeadFromSettings(s);
        if (s) writeSettingsCache(s);
      } catch (err) {
        console.warn("Failed to fetch public settings (client):", err);
        if (!cached) setSettings(null);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [initialSettings]);

  return (
    <SettingContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingContext.Provider>
  );
}
