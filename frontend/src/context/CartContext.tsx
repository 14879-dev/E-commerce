import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product, CustomizationSelection, LeatherColor } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: number, color: LeatherColor, customization?: CustomizationSelection) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('psh_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('psh_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, size: number, color: LeatherColor, customization?: CustomizationSelection) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(item => 
        item.product.id === product.id && 
        item.size === size && 
        item.selectedColor === color && 
        !item.isCustomized && !customization
      );

      if (existingIdx !== -1 && !customization) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product,
        size,
        selectedColor: color,
        quantity: 1,
        isCustomized: !!customization,
        customizationDetails: customization
      };

      return [...prev, newItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.customizationDetails ? item.customizationDetails.customPrice : item.product.price;
    return sum + (itemPrice * item.quantity);
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
