// context/CartContext.js
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const normalizeSelectedOptions = (selectedOptions = {}) => {
  if (!selectedOptions || typeof selectedOptions !== "object") return {};
  return Object.entries(selectedOptions)
    .map(([key, value]) => [String(key).trim(), String(value ?? "").trim()])
    .filter(([key, value]) => key.length > 0 && value.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
};

const buildVariantHash = (productId, selectedOptions = {}) => {
  const normalized = normalizeSelectedOptions(selectedOptions);
  const signature = Object.entries(normalized)
    .map(([key, value]) => `${key}:${value.toLowerCase()}`)
    .join("|");
  return `${productId}::${signature || "default"}`;
};

const getCartItemKey = (productId, variantHash = "") =>
  `${productId}::${variantHash || "default"}`;

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Dispatch cart update event
  const dispatchCartUpdate = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { cart } }),
      );
    }
  }, [cart]);

  // Load cart from sessionStorage (for guest users)
  const loadSessionCart = useCallback(() => {
    if (typeof window === "undefined") return [];

    try {
      const sessionCart = JSON.parse(
        sessionStorage.getItem("guestCart") || "[]",
      );
      return (sessionCart || []).map((item) => {
        const selectedOptions = normalizeSelectedOptions(
          item.selectedOptions || {},
        );
        const variantHash =
          item.variantHash || buildVariantHash(item.id, selectedOptions);
        return { ...item, selectedOptions, variantHash };
      });
    } catch (error) {
      console.error("Error loading session cart:", error);
      return [];
    }
  }, []);

  // Save cart to sessionStorage (for guest users)
  const saveSessionCart = useCallback((cartData) => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.setItem("guestCart", JSON.stringify(cartData));
    } catch (error) {
      console.error("Error saving session cart:", error);
    }
  }, []);

  // Clear session cart
  const clearSessionCart = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.removeItem("guestCart");
    } catch (error) {
      console.error("Error clearing session cart:", error);
    }
  }, []);

  // Load cart from backend (for logged-in users)
  const loadBackendCart = useCallback(async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/cart/${userId}`);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Backend cart endpoints not available");
      }

      const data = await response.json();

      if (data.success) {
        return (data.cart || []).map((item) => {
          const selectedOptions = normalizeSelectedOptions(
            item.selectedOptions || {},
          );
          const variantHash =
            item.variantHash || buildVariantHash(item.id, selectedOptions);
          return { ...item, selectedOptions, variantHash };
        });
      } else {
        throw new Error(data.message || "Failed to load cart from backend");
      }
    } catch (error) {
      console.error("Error loading backend cart:", error);
      throw error;
    }
  }, []);

  // Load cart (from backend for logged-in users, sessionStorage for guests)
  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (user) {
        // Logged-in user: load from backend
        try {
          const backendCart = await loadBackendCart(user.id);
          setCart(backendCart);
        } catch (backendError) {
          console.warn("Backend cart not available:", backendError.message);
          setError("Cart service unavailable");
          setCart([]);
        }
      } else {
        // Guest user: load from sessionStorage
        const sessionCart = loadSessionCart();
        setCart(sessionCart);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading cart:", error);
      setError(error.message);
      setCart([]);
      setIsLoading(false);
    }
  }, [user, loadBackendCart, loadSessionCart]);

  // Sync session cart to backend when user logs in
  const syncSessionCartToBackend = useCallback(async () => {
    if (!user || typeof window === "undefined") return;

    try {
      const sessionCart = loadSessionCart();
      if (sessionCart.length === 0) return;

      console.log("Syncing session cart to backend:", sessionCart);

      const response = await fetch(`${API_BASE}/cart/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          localCartItems: sessionCart,
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Session cart synced successfully");
        // Clear session cart after successful sync
        clearSessionCart();
        // Reload cart from backend
        await loadCart();
      } else {
        console.warn("Failed to sync session cart:", data.message);
      }
    } catch (error) {
      console.warn("Error syncing session cart to backend:", error);
    }
  }, [user, loadSessionCart, clearSessionCart, loadCart]);

  // Add item to cart
  const addToCart = useCallback(
    async (product, quantity = 1, variant = {}) => {
      try {
        const selectedOptions = normalizeSelectedOptions(
          variant?.selectedOptions ? variant.selectedOptions : variant,
        );
        const variantHash = buildVariantHash(product.id, selectedOptions);
        const itemKey = getCartItemKey(product.id, variantHash);

        const existingItemIndex = cart.findIndex(
          (item) => getCartItemKey(item.id, item.variantHash) === itemKey,
        );

        let newCart;

        if (existingItemIndex > -1) {
          newCart = cart.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        } else {
          const cartItem = {
            id: product.id,
            name: product.name,
            price: product.new_price,
            quantity,
            image: product.image,
            category: product.category,
            available: product.available,
            stock_quantity: product.stock_quantity,
            selectedOptions,
            variantHash,
          };
          newCart = [...cart, cartItem];
        }

        setCart(newCart);

        if (user) {
          try {
            const response = await fetch(`${API_BASE}/cart/add`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                productId: product.id,
                quantity,
                selectedOptions,
                variantHash,
              }),
            });

            const data = await response.json();
            if (!data.success) {
              setError("Failed to add item to cart");
              setCart(cart);
              return false;
            }
            return true;
          } catch (backendError) {
            setError("Cart service unavailable");
            setCart(cart);
            return false;
          }
        } else {
          saveSessionCart(newCart);
          return true;
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        setError(error.message);
        return false;
      }
    },
    [cart, user, saveSessionCart],
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (productId, variantHash = null) => {
      try {
        const newCart = cart.filter((item) => {
          const sameProduct = item.id === productId;
          const sameVariant =
            !variantHash || (item.variantHash || "") === (variantHash || "");
          return !(sameProduct && sameVariant);
        });

        setCart(newCart);

        if (user) {
          try {
            const response = await fetch(`${API_BASE}/cart/remove`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                productId,
                variantHash,
              }),
            });

            const data = await response.json();
            if (!data.success) {
              setError("Failed to remove item from cart");
              setCart(cart);
            }
          } catch (backendError) {
            setError("Cart service unavailable");
            setCart(cart);
          }
        } else {
          saveSessionCart(newCart);
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        setError(error.message);
      }
    },
    [cart, user, saveSessionCart],
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (productId, quantity, variantHash = null) => {
      if (quantity <= 0) {
        await removeFromCart(productId, variantHash);
        return;
      }

      try {
        const newCart = cart.map((item) => {
          const sameProduct = item.id === productId;
          const sameVariant =
            !variantHash || (item.variantHash || "") === (variantHash || "");
          if (sameProduct && sameVariant) {
            return { ...item, quantity };
          }
          return item;
        });

        setCart(newCart);

        if (user) {
          try {
            const response = await fetch(`${API_BASE}/cart/update`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                productId,
                quantity,
                variantHash,
              }),
            });

            const data = await response.json();
            if (!data.success) {
              setError("Failed to update cart");
              setCart(cart);
            }
          } catch (backendError) {
            setError("Cart service unavailable");
            setCart(cart);
          }
        } else {
          saveSessionCart(newCart);
        }
      } catch (error) {
        console.error("Error updating cart:", error);
        setError(error.message);
      }
    },
    [cart, user, removeFromCart, saveSessionCart],
  );

  // Increase quantity
  const increaseQuantity = useCallback(
    async (productId, variantHash = null) => {
      const item = cart.find((x) => {
        const sameProduct = x.id === productId;
        const sameVariant =
          !variantHash || (x.variantHash || "") === (variantHash || "");
        return sameProduct && sameVariant;
      });

      if (item) {
        await updateQuantity(productId, item.quantity + 1, variantHash);
      }
    },
    [cart, updateQuantity],
  );

  // Decrease quantity
  const decreaseQuantity = useCallback(
    async (productId, variantHash = null) => {
      const item = cart.find((x) => {
        const sameProduct = x.id === productId;
        const sameVariant =
          !variantHash || (x.variantHash || "") === (variantHash || "");
        return sameProduct && sameVariant;
      });

      if (item && item.quantity > 1) {
        await updateQuantity(productId, item.quantity - 1, variantHash);
      } else if (item && item.quantity === 1) {
        await removeFromCart(productId, variantHash);
      }
    },
    [cart, updateQuantity, removeFromCart],
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      // Optimistic update
      setCart([]);

      if (user) {
        // Logged-in user: send to backend
        try {
          const response = await fetch(`${API_BASE}/cart/clear/${user.id}`, {
            method: "DELETE",
          });

          const data = await response.json();
          if (!data.success) {
            console.warn("Backend clear failed:", data.message);
            setError("Failed to clear cart");
          }
        } catch (backendError) {
          console.warn(
            "Backend not available for clear operation:",
            backendError.message,
          );
          setError("Cart service unavailable");
        }
      } else {
        // Guest user: clear sessionStorage
        clearSessionCart();
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      setError(error.message);
    }
  }, [user, clearSessionCart]);

  // Check if item is in cart
  const isInCart = useCallback(
    (productId, variantHash = null) => {
      return cart.some((item) => {
        const sameProduct = item.id === productId;
        const sameVariant =
          !variantHash || (item.variantHash || "") === (variantHash || "");
        return sameProduct && sameVariant;
      });
    },
    [cart],
  );

  // Get item quantity
  const getItemQuantity = useCallback(
    (productId, variantHash = null) => {
      return cart
        .filter((item) => {
          const sameProduct = item.id === productId;
          const sameVariant =
            !variantHash || (item.variantHash || "") === (variantHash || "");
          return sameProduct && sameVariant;
        })
        .reduce((sum, item) => sum + item.quantity, 0);
    },
    [cart],
  );

  // Get total items count
  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Get total price
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  // Load cart on mount and when user changes
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Sync session cart when user logs in
  useEffect(() => {
    if (user) {
      syncSessionCartToBackend();
    }
  }, [user, syncSessionCartToBackend]);

  // Dispatch cart update whenever cart changes
  useEffect(() => {
    dispatchCartUpdate();
  }, [cart, dispatchCartUpdate]);

  const value = {
    cart,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    getTotalItems,
    getTotalPrice,
    loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
