// app/context/SettingContext.jsx
"use client";

import React, { createContext, useEffect, useState } from "react";

export const SettingContext = createContext({
  settings: null,
  setSettings: () => {}
});

function setHeadFromSettings(settings) {
  if (!settings) return;

  const siteTitle = settings?.siteTitle || document.title;
  const siteDescription = settings?.siteDescription || document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const faviconUrl = settings?.branding?.favicon?.url || '/favicon.ico';
  const ogImage = settings?.branding?.siteLogo?.url || '';
  console.log(settings)
  // Title
  document.title = siteTitle;

  // Description meta
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', siteDescription);

  // OG title/desc/image
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
  ogTitle.setAttribute('content', siteTitle);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) { ogDesc = document.createElement('meta'); ogDesc.setAttribute('property', 'og:description'); document.head.appendChild(ogDesc); }
  ogDesc.setAttribute('content', siteDescription);

  let ogImageEl = document.querySelector('meta[property="og:image"]');
  if (!ogImageEl) { ogImageEl = document.createElement('meta'); ogImageEl.setAttribute('property', 'og:image'); document.head.appendChild(ogImageEl); }
  ogImageEl.setAttribute('content', ogImage);

  // Favicon
  if (faviconUrl) {
    // remove existing favicons to avoid duplicates
    const existingIcons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    existingIcons.forEach(i => i.parentNode?.removeChild(i));

    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    document.head.appendChild(link);

    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = faviconUrl;
    document.head.appendChild(apple);
  }
}

export default function SettingsProvider({ initialSettings = null, children }) {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    // If initial passed from server exists, use it and skip fetching
    if (initialSettings) {
      setHeadFromSettings(initialSettings);
      setSettings(initialSettings);
      return;
    }

    let mounted = true;
    const PUBLIC_SETTINGS_ENDPOINT = (process.env.NEXT_PUBLIC_API_URL || "") + "/settings/public";

    async function load() {
      try {
        const res = await fetch(PUBLIC_SETTINGS_ENDPOINT, { cache: "no-store" });
        if (!mounted) return;
        if (res && res.ok) {
          const json = await res.json();
          const s = json?.settings || null;
          setSettings(s);
          setHeadFromSettings(s);
        } else {
          // fallback: keep settings null
          setSettings(null);
        }
      } catch (err) {
        // backend unreachable — fine, keep defaults
        console.warn("Failed to fetch public settings (client):", err);
        setSettings(null);
      }
    }
    load();

    return () => { mounted = false; };
  }, [initialSettings]);

  return (
    <SettingContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingContext.Provider>
  );
}
