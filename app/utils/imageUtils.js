// utils/imageUtils.js - single source for image URL resolution and optimization
import { useEffect, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
  /\/$/,
  "",
);

const PLACEHOLDER_BASE = "/placeholders";
const FALLBACK_IMAGE = `${PLACEHOLDER_BASE}/product-placeholder.svg`;
const ERROR_IMAGE = `${PLACEHOLDER_BASE}/product-placeholder.svg`;
const AVATAR_FALLBACK_IMAGE = `${PLACEHOLDER_BASE}/avatar-placeholder.svg`;

const IMAGE_CONTEXTS = {
  thumb: {
    width: 160,
    height: 160,
    sizes: "160px",
    priority: false,
    crop: "fill",
  },
  card: {
    width: 576,
    height: 720,
    sizes: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
    priority: false,
    crop: "fill",
  },
  list: {
    width: 720,
    height: 900,
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw",
    priority: false,
    crop: "fill",
  },
  blogCard: {
    width: 960,
    height: 640,
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px",
    priority: false,
    crop: "fill",
  },
  blogHero: {
    width: 1600,
    height: 900,
    sizes: "(max-width: 768px) 100vw, 75vw",
    priority: true,
    crop: "limit",
  },
  adminPreview: {
    width: 1440,
    height: 960,
    sizes: "(max-width: 1024px) 100vw, 1024px",
    priority: false,
    crop: "limit",
  },
  adminEditorThumb: {
    width: 320,
    height: 180,
    sizes: "(max-width: 768px) 45vw, 180px",
    priority: false,
    crop: "fill",
  },
  adminTableThumb: {
    width: 80,
    height: 80,
    sizes: "40px",
    priority: false,
    crop: "fill",
  },
  detail: {
    width: 1200,
    height: 1200,
    sizes: "(max-width: 768px) 100vw, 50vw",
    priority: true,
    crop: "limit",
  },
  zoom: {
    width: 1800,
    height: 1800,
    sizes: "(max-width: 768px) 100vw, 50vw",
    priority: false,
    crop: "limit",
  },
  avatar: {
    width: 96,
    height: 96,
    sizes: "96px",
    priority: false,
    crop: "fill",
  },
};

const toSafeString = (value) => (typeof value === "string" ? value.trim() : "");
const isHttp = (value) => /^https?:\/\//i.test(value);
const isDataLike = (value) => /^(data:|blob:)/i.test(value);

const getContextConfig = (context = "detail") => {
  if (!context) return IMAGE_CONTEXTS.detail;
  if (typeof context === "string") return IMAGE_CONTEXTS[context] || IMAGE_CONTEXTS.detail;
  return { ...IMAGE_CONTEXTS.detail, ...context };
};

const isCloudinaryUrl = (value) => {
  if (!value || !isHttp(value)) return false;
  try {
    const parsed = new URL(value);
    return /cloudinary\.com$/i.test(parsed.hostname) || /cloudinary\.com/i.test(parsed.hostname);
  } catch {
    return value.includes("cloudinary.com");
  }
};

const buildCloudinaryTransform = (context = "detail") => {
  const cfg = getContextConfig(context);
  const quality = cfg.quality || "auto";
  const format = cfg.format || "auto";
  const dpr = cfg.dpr || "auto";
  const crop = cfg.crop || "limit";

  const chunks = [`f_${format}`, `q_${quality}`, `dpr_${dpr}`];
  if (crop) chunks.push(`c_${crop}`);
  if (cfg.width) chunks.push(`w_${Math.max(1, Number(cfg.width) || 1)}`);
  if (cfg.height) chunks.push(`h_${Math.max(1, Number(cfg.height) || 1)}`);
  return chunks.join(",");
};

export const applyCloudinaryTransform = (source, context = "detail") => {
  const url = toSafeString(source);
  if (!url || !isCloudinaryUrl(url)) return url;

  const transform = buildCloudinaryTransform(context);
  if (!transform) return url;

  try {
    const parsed = new URL(url);
    const marker = "/upload/";
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return url;

    const before = parsed.pathname.slice(0, markerIndex + marker.length);
    const after = parsed.pathname.slice(markerIndex + marker.length);
    const segments = after.split("/").filter(Boolean);

    if (segments.length === 0) {
      parsed.pathname = `${before}${transform}`;
      return parsed.toString();
    }

    const firstSegment = segments[0];
    if (/^v\d+$/i.test(firstSegment)) {
      segments.unshift(transform);
    } else if (firstSegment.includes(",") || /^[a-z]{1,4}_[^/]+/i.test(firstSegment)) {
      segments[0] = transform;
    } else {
      segments.unshift(transform);
    }

    parsed.pathname = `${before}${segments.join("/")}`;
    return parsed.toString();
  } catch {
    return url;
  }
};

const resolveLegacySource = (source) => {
  const clean = toSafeString(source);
  if (!clean) return "";

  if (clean.includes("railway.app")) {
    const fileName = clean.split("/images/")[1];
    if (fileName) return `/images/${fileName}`;
  }

  return clean;
};

export const resolveImageSrc = (source, options = {}) => {
  const {
    fallback = FALLBACK_IMAGE,
    context = "detail",
    optimize = true,
  } = options;

  const clean = resolveLegacySource(source);
  if (!clean) return fallback;

  if (isDataLike(clean)) return clean;

  let resolved = clean;
  if (isHttp(clean)) {
    resolved = clean;
  } else if (clean.startsWith("/images/") || clean.startsWith("/uploads/")) {
    resolved = `${API_BASE}${clean}`;
  } else if (
    !clean.includes("/") &&
    /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(clean)
  ) {
    resolved = `${API_BASE}/images/${clean}`;
  } else if (clean.startsWith("images/") || clean.startsWith("uploads/")) {
    resolved = `${API_BASE}/${clean}`;
  } else if (clean.startsWith("/")) {
    // Frontend static assets like /placeholders/*
    resolved = clean;
  } else {
    resolved = `${API_BASE}/${clean}`;
  }

  if (!optimize) return resolved;
  return applyCloudinaryTransform(resolved, context);
};

// Backward-compatible signature:
// getImageSrc(src, fallbackString)
// getImageSrc(src, { fallback, context, optimize })
export const getImageSrc = (source, fallbackOrOptions = FALLBACK_IMAGE, maybeContext) => {
  if (fallbackOrOptions && typeof fallbackOrOptions === "object") {
    return resolveImageSrc(source, fallbackOrOptions);
  }
  return resolveImageSrc(source, {
    fallback: typeof fallbackOrOptions === "string" ? fallbackOrOptions : FALLBACK_IMAGE,
    context: maybeContext || "detail",
    optimize: true,
  });
};

export const getOptimizedImageSrc = (source, context = "detail", fallback = FALLBACK_IMAGE) =>
  resolveImageSrc(source, { context, fallback, optimize: true });

export const getImageDimensions = (context = "detail") => {
  const cfg = getContextConfig(context);
  return { width: cfg.width, height: cfg.height, sizes: cfg.sizes };
};

export const shouldPrioritizeImage = (context = "detail") => {
  const cfg = getContextConfig(context);
  return !!cfg.priority;
};

export const getImageLoadingProps = (context = "detail") => {
  const priority = shouldPrioritizeImage(context);
  return {
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : "auto",
  };
};

export const handleImageError = (event, fallbackImage = ERROR_IMAGE) => {
  const target = event?.currentTarget || event?.target;
  if (!target) return;
  if (target.src && target.src.endsWith(fallbackImage)) return;
  target.onerror = null;
  target.src = fallbackImage;
};

export const useImageWithFallback = (src, fallback = FALLBACK_IMAGE, context = "detail") => {
  const [imageSrc, setImageSrc] = useState(
    resolveImageSrc(src, { fallback, context }),
  );
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setImageSrc(resolveImageSrc(src, { fallback, context }));
    setIsError(false);
  }, [src, fallback, context]);

  const handleError = () => {
    if (isError) return;
    setIsError(true);
    setImageSrc(fallback);
  };

  return { imageSrc, handleError, isError };
};

export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  return resolveImageSrc(url, { optimize: false, fallback: null });
}

export {
  IMAGE_CONTEXTS,
  FALLBACK_IMAGE,
  ERROR_IMAGE,
  AVATAR_FALLBACK_IMAGE,
};
