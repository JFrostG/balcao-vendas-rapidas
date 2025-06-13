
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { useShiftStore } from './shiftStore';
import { useProductStore } from './productStore';
import { useSalesStore } from './salesStore';
import { useTableStore } from './tableStore';
import { User, Shift, Product, Sale, CartItem, PaymentMethod, Table, TableStatus } from '../types';

interface AppState {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Shift
  currentShift: Shift | null;
  shifts: Shift[];
  openShift: (user: User) => void;
  closeShift: () => void;
  
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Sales
  sales: Sale[];
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  completeSale: (paymentMethod: PaymentMethod, discount: number, discountType: 'value' | 'percentage') => void;
  deleteSale: (saleId: string) => void;
  updateSalePaymentMethod: (saleId: string, paymentMethod: PaymentMethod) => void;
  
  // Tables
  tables: Table[];
  addToTable: (tableNumber: number, product: Product, quantity?: number) => void;
  removeFromTable: (tableNumber: number, productId: string) => void;
  updateTableQuantity: (tableNumber: number, productId: string, quantity: number) => void;
  updateTableStatus: (tableNumber: number, status: TableStatus) => void;
  clearTable: (tableNumber: number) => void;
  completeTableSale: (tableNumber: number, paymentMethod: PaymentMethod, discount: number, discountType: 'value' | 'percentage') => void;
  completeTableSaleWithSplit: (tableNumber: number, payments: Array<{method: PaymentMethod, amount: number}>, discount: number, discountType: 'value' | 'percentage') => void;
  
  // Users
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Utils
  getCartTotal: () => number;
  getCurrentShiftSales: () => Sale[];
  getPaymentBreakdown: (sales: Sale[]) => any;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Delegate to individual stores
      get currentUser() { return useAuthStore.getState().currentUser; },
      setCurrentUser: (user) => useAuthStore.getState().setCurrentUser(user),
      
      get currentShift() { return useShiftStore.getState().currentShift; },
      get shifts() { return useShiftStore.getState().shifts; },
      openShift: (user) => useShiftStore.getState().openShift(user),
      closeShift: () => useShiftStore.getState().closeShift(),
      
      get products() { return useProductStore.getState().products; },
      addProduct: (product) => useProductStore.getState().addProduct(product),
      updateProduct: (id, product) => useProductStore.getState().updateProduct(id, product),
      deleteProduct: (id) => useProductStore.getState().deleteProduct(id),
      
      get sales() { return useSalesStore.getState().sales; },
      get cart() { return useSalesStore.getState().cart; },
      addToCart: (product, quantity) => {
        const { currentShift } = get();
        if (!currentShift?.isActive) return;
        useSalesStore.getState().addToCart(product, quantity);
      },
      removeFromCart: (productId) => useSalesStore.getState().removeFromCart(productId),
      updateCartQuantity: (productId, quantity) => useSalesStore.getState().updateCartQuantity(productId, quantity),
      clearCart: () => useSalesStore.getState().clearCart(),
      completeSale: (paymentMethod, discount, discountType) => {
        const { currentShift, currentUser } = get();
        if (!currentShift || !currentUser) return;
        useSalesStore.getState().completeSale(paymentMethod, discount, discountType);
      },
      deleteSale: (saleId) => useSalesStore.getState().deleteSale(saleId),
      updateSalePaymentMethod: (saleId, paymentMethod) => useSalesStore.getState().updateSalePaymentMethod(saleId, paymentMethod),
      
      get tables() { return useTableStore.getState().tables; },
      addToTable: (tableNumber, product, quantity) => {
        const { currentShift } = get();
        if (!currentShift?.isActive) return;
        useTableStore.getState().addToTable(tableNumber, product, quantity);
      },
      removeFromTable: (tableNumber, productId) => useTableStore.getState().removeFromTable(tableNumber, productId),
      updateTableQuantity: (tableNumber, productId, quantity) => useTableStore.getState().updateTableQuantity(tableNumber, productId, quantity),
      updateTableStatus: (tableNumber, status) => useTableStore.getState().updateTableStatus(tableNumber, status),
      clearTable: (tableNumber) => useTableStore.getState().clearTable(tableNumber),
      completeTableSale: (tableNumber, paymentMethod, discount, discountType) => {
        // Implementation with proper store access
        console.log('Complete table sale', { tableNumber, paymentMethod, discount, discountType });
      },
      completeTableSaleWithSplit: (tableNumber, payments, discount, discountType) => {
        // Implementation with proper store access
        console.log('Complete table sale with split', { tableNumber, payments, discount, discountType });
      },
      
      get users() { return useAuthStore.getState().users; },
      addUser: (user) => useAuthStore.getState().addUser(user),
      updateUser: (id, user) => useAuthStore.getState().updateUser(id, user),
      deleteUser: (id) => useAuthStore.getState().deleteUser(id),
      
      // Utils
      getCartTotal: () => useSalesStore.getState().getCartTotal(),
      getCurrentShiftSales: () => {
        const { sales, currentShift } = get();
        if (!currentShift) return [];
        return sales.filter(sale => sale.shiftId === currentShift.id);
      },
      getPaymentBreakdown: (sales) => {
        return sales.reduce((breakdown, sale) => {
          breakdown[sale.paymentMethod] += sale.total;
          return breakdown;
        }, {
          dinheiro: 0,
          debito: 0,
          credito: 0,
          pix: 0,
          cortesia: 0,
        });
      },
    }),
    {
      name: 'burger-pdv-storage',
      partialize: (state) => ({
        shifts: state.shifts,
        products: state.products,
        sales: state.sales,
        tables: state.tables,
        users: state.users,
      }),
    }
  )
);
