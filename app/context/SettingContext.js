'use client';

import React, { createContext, useState } from 'react';

export const SettingContext = createContext({
  settings: null,
  setSettings: () => {}
});

/**
 * SettingsProvider
 * - initialSettings: object fetched on the server (layout)
 * - provides settings + setter to client components (Header, Footer, widgets)
 */
export default function SettingsProvider({ initialSettings = {}, children }) {
  const [settings, setSettings] = useState(initialSettings);

  return (
    <SettingContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingContext.Provider>
  );
}
