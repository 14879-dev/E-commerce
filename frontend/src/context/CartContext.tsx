import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product, LeatherColor } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: number, color: LeatherColor) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('psh_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('psh_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    const handleSync = (e: StorageEvent) => {
      if (e.key === 'psh_cart') {
        try {
          const saved = e.newValue;
          if (saved) {
            setItems(JSON.parse(saved));
          } else {
            setItems([]);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const addToCart = (product: Product, size: number, color: LeatherColor) => {
    const safeColor = (color || 'saddle-tan').toString() as LeatherColor;
    const safeSize = Number(size) || 9;

    setItems(prev => {
      const existingIdx = prev.findIndex(item => 
        item.product?.id === product.id && 
        Number(item.size) === safeSize && 
        item.selectedColor === safeColor
      );

      if (existingIdx !== -1) {
        const nextItems = [...prev];
        nextItems[existingIdx] = {
          ...nextItems[existingIdx],
          quantity: (nextItems[existingIdx].quantity || 1) + 1,
        };
        return nextItems;
      } else {
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product,
          size: safeSize,
          selectedColor: safeColor,
          quantity: 1,
        };
        return [...prev, newItem];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = (item.quantity || 1) + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem('psh_cart');
    } catch {}
  };

  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.product?.price) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
