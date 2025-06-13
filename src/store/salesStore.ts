
import { create } from 'zustand';
import { Sale, CartItem, PaymentMethod, Product } from '../types';

interface SalesState {
  sales: Sale[];
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  completeSale: (paymentMethod: PaymentMethod, discount: number, discountType: 'value' | 'percentage') => void;
  deleteSale: (saleId: string) => void;
  updateSalePaymentMethod: (saleId: string, paymentMethod: PaymentMethod) => void;
  getCartTotal: () => number;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  cart: [],
  addToCart: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.cart.find(item => item.productId === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price }
              : item
          ),
        };
      } else {
        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity,
          subtotal: product.price * quantity,
        };
        return { cart: [...state.cart, newItem] };
      }
    });
  },
  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter(item => item.productId !== productId),
    }));
  },
  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      cart: state.cart.map(item =>
        item.productId === productId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      ),
    }));
  },
  clearCart: () => set({ cart: [] }),
  completeSale: (paymentMethod, discount, discountType) => {
    const { cart } = get();
    if (cart.length === 0) return;
    
    const subtotal = get().getCartTotal();
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discount) / 100 
      : discount;
    const total = Math.max(0, subtotal - discountAmount);
    
    const newSale: Sale = {
      id: Date.now().toString(),
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        isCourtesy: paymentMethod === 'cortesia',
      })),
      total,
      paymentMethod,
      discount: discountAmount,
      discountType,
      shiftId: 'current-shift',
      userId: 'current-user',
      userName: 'Current User',
      createdAt: new Date(),
      tableNumber: 0,
    };
    
    set((state) => ({
      sales: [...state.sales, newSale],
      cart: [],
    }));
  },
  deleteSale: (saleId) => {
    set((state) => ({
      sales: state.sales.filter(sale => sale.id !== saleId),
    }));
  },
  updateSalePaymentMethod: (saleId, paymentMethod) => {
    set((state) => ({
      sales: state.sales.map(sale =>
        sale.id === saleId ? { ...sale, paymentMethod } : sale
      ),
    }));
  },
  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  },
}));
