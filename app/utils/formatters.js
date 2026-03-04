const formatterCache = new Map();

const getFormatter = (locale, options) => {
  const key = `${locale}:${JSON.stringify(options)}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.NumberFormat(locale, options));
  }
  return formatterCache.get(key);
};

export const toSafeNumber = (value, fallback = 0) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) return fallback;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatCurrency = (
  value,
  {
    locale = "en-US",
    currency = "USD",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = {},
) => {
  const formatter = getFormatter(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });
  return formatter.format(toSafeNumber(value, 0));
};

export const formatNumber = (
  value,
  {
    locale = "en-US",
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = {},
) => {
  const formatter = getFormatter(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  return formatter.format(toSafeNumber(value, 0));
};

export const formatPercent = (
  value,
  { minimumFractionDigits = 2, maximumFractionDigits = 2 } = {},
) =>
  `${formatNumber(value, {
    minimumFractionDigits,
    maximumFractionDigits,
  })}%`;
