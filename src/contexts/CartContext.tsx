"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export interface MenuItemAddon {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  optionPrice: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export interface CartItem extends MenuItem {
  cartKey: string;
  quantity: number;
  basePrice: number;
  addons: MenuItemAddon[];
}

interface CartContextProps {
  cart: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: MenuItem, addons?: MenuItemAddon[]) => void;
  removeItem: (identifier: string) => void;
  updateQuantity: (identifier: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

function createCartKey(itemId: string, addons: MenuItemAddon[]) {
  const addonKey = addons
    .map((addon) => addon.optionId)
    .sort()
    .join("-");

  return addonKey ? `${itemId}-${addonKey}` : itemId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cart");
      if (stored) setCart(JSON.parse(stored));
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addItem = (item: MenuItem, addons: MenuItemAddon[] = []) => {
    const addonsTotal = addons.reduce(
      (sum, addon) => sum + Number(addon.optionPrice || 0),
      0
    );

    const unitPrice = Number(item.price || 0) + addonsTotal;
    const cartKey = createCartKey(item.id, addons);

    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.cartKey === cartKey);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.cartKey === cartKey
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [
        ...current,
        {
          ...item,
          cartKey,
          basePrice: Number(item.price || 0),
          price: unitPrice,
          addons,
          quantity: 1,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const removeItem = (identifier: string) => {
    setCart((current) =>
      current.filter(
        (cartItem) => cartItem.cartKey !== identifier && cartItem.id !== identifier
      )
    );
  };

  const updateQuantity = (identifier: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(identifier);
      return;
    }

    setCart((current) =>
      current.map((cartItem) =>
        cartItem.cartKey === identifier || cartItem.id === identifier
          ? { ...cartItem, quantity }
          : cartItem
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  const totalPrice = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0
    );
  }, [cart]);

  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalPrice,
        totalQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return ctx;
}