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
  completeTableSale: (tableNumber: number, paymentMethod: PaymentMethod) => void;
  completeTableSaleWithSplit: (tableNumber: number, payments: Array<{method: PaymentMethod, amount: number}>) => void;
  
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
      // Auth - sincronização com authStore
      currentUser: null,
      setCurrentUser: (user) => {
        useAuthStore.getState().setCurrentUser(user);
        set({ currentUser: user });
      },
      
      // Shift - sincronização com shiftStore
      currentShift: null,
      shifts: [],
      openShift: (user) => {
        useShiftStore.getState().openShift(user);
        const shiftState = useShiftStore.getState();
        set({ 
          currentShift: shiftState.currentShift,
          shifts: shiftState.shifts 
        });
      },
      closeShift: () => {
        useShiftStore.getState().closeShift();
        const shiftState = useShiftStore.getState();
        set({ 
          currentShift: shiftState.currentShift,
          shifts: shiftState.shifts 
        });
      },
      
      // Products - sincronização com productStore
      products: [],
      addProduct: (product) => {
        useProductStore.getState().addProduct(product);
        set({ products: useProductStore.getState().products });
      },
      updateProduct: (id, product) => {
        useProductStore.getState().updateProduct(id, product);
        set({ products: useProductStore.getState().products });
      },
      deleteProduct: (id) => {
        useProductStore.getState().deleteProduct(id);
        set({ products: useProductStore.getState().products });
      },
      
      // Sales - sincronização com salesStore
      sales: [],
      cart: [],
      addToCart: (product, quantity) => {
        const { currentShift } = get();
        if (!currentShift?.isActive) return;
        useSalesStore.getState().addToCart(product, quantity);
        const salesState = useSalesStore.getState();
        set({ 
          cart: salesState.cart,
          sales: salesState.sales 
        });
      },
      removeFromCart: (productId) => {
        useSalesStore.getState().removeFromCart(productId);
        const salesState = useSalesStore.getState();
        set({ 
          cart: salesState.cart,
          sales: salesState.sales 
        });
      },
      updateCartQuantity: (productId, quantity) => {
        useSalesStore.getState().updateCartQuantity(productId, quantity);
        const salesState = useSalesStore.getState();
        set({ 
          cart: salesState.cart,
          sales: salesState.sales 
        });
      },
      clearCart: () => {
        useSalesStore.getState().clearCart();
        const salesState = useSalesStore.getState();
        set({ 
          cart: salesState.cart,
          sales: salesState.sales 
        });
      },
      completeSale: (paymentMethod, discount, discountType) => {
        const { currentShift, currentUser } = get();
        if (!currentShift || !currentUser) return;
        useSalesStore.getState().completeSale(paymentMethod, discount, discountType);
        const salesState = useSalesStore.getState();
        set({ 
          cart: salesState.cart,
          sales: salesState.sales 
        });
      },
      deleteSale: (saleId) => {
        useSalesStore.getState().deleteSale(saleId);
        set({ sales: useSalesStore.getState().sales });
      },
      updateSalePaymentMethod: (saleId, paymentMethod) => {
        useSalesStore.getState().updateSalePaymentMethod(saleId, paymentMethod);
        set({ sales: useSalesStore.getState().sales });
      },
      
      // Tables - sincronização com tableStore
      tables: [],
      addToTable: (tableNumber, product, quantity) => {
        const { currentShift } = get();
        if (!currentShift?.isActive) return;
        useTableStore.getState().addProductToTable(tableNumber, product, quantity);
        set({ tables: useTableStore.getState().tables });
      },
      removeFromTable: (tableNumber, productId) => {
        useTableStore.getState().removeProductFromTable(tableNumber, productId);
        set({ tables: useTableStore.getState().tables });
      },
      updateTableQuantity: (tableNumber, productId, quantity) => {
        useTableStore.getState().updateProductQuantity(tableNumber, productId, quantity);
        set({ tables: useTableStore.getState().tables });
      },
      updateTableStatus: (tableNumber, status) => {
        useTableStore.getState().updateTableStatus(tableNumber, status);
        set({ tables: useTableStore.getState().tables });
      },
      clearTable: (tableNumber) => {
        useTableStore.getState().clearTable(tableNumber);
        set({ tables: useTableStore.getState().tables });
      },
      completeTableSale: (tableNumber, paymentMethod) => {
        useTableStore.getState().completeTableSale(tableNumber, paymentMethod);
        const tableState = useTableStore.getState();
        const salesState = useSalesStore.getState();
        set({ 
          tables: tableState.tables,
          sales: salesState.sales 
        });
      },
      completeTableSaleWithSplit: (tableNumber, payments) => {
        useTableStore.getState().completeTableSaleWithSplit(tableNumber, payments);
        const tableState = useTableStore.getState();
        const salesState = useSalesStore.getState();
        set({ 
          tables: tableState.tables,
          sales: salesState.sales 
        });
      },
      
      // Users - sincronização com authStore
      users: [],
      addUser: (user) => {
        useAuthStore.getState().addUser(user);
        set({ users: useAuthStore.getState().users });
      },
      updateUser: (id, user) => {
        useAuthStore.getState().updateUser(id, user);
        set({ users: useAuthStore.getState().users });
      },
      deleteUser: (id) => {
        useAuthStore.getState().deleteUser(id);
        set({ users: useAuthStore.getState().users });
      },
      
      // Utils
      getCartTotal: () => {
        return useSalesStore.getState().getCartTotal();
      },
      getCurrentShiftSales: () => {
        const sales = useSalesStore.getState().sales;
        const currentShift = useShiftStore.getState().currentShift;
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
        currentUser: state.currentUser,
        currentShift: state.currentShift,
      }),
    }
  )
);

// Sincronizar com os stores individuais na inicialização
const syncStores = () => {
  const authState = useAuthStore.getState();
  const shiftState = useShiftStore.getState();
  const productState = useProductStore.getState();
  const salesState = useSalesStore.getState();
  const tableState = useTableStore.getState();
  
  useStore.setState({
    currentUser: authState.currentUser,
    users: authState.users,
    currentShift: shiftState.currentShift,
    shifts: shiftState.shifts,
    products: productState.products,
    sales: salesState.sales,
    cart: salesState.cart,
    tables: tableState.tables,
  });
};

// Executar sincronização na inicialização
if (typeof window !== 'undefined') {
  syncStores();
  
  // Observar mudanças nos stores individuais
  useAuthStore.subscribe((state) => {
    useStore.setState({
      currentUser: state.currentUser,
      users: state.users,
    });
  });
  
  useShiftStore.subscribe((state) => {
    useStore.setState({
      currentShift: state.currentShift,
      shifts: state.shifts,
    });
  });
  
  useProductStore.subscribe((state) => {
    useStore.setState({
      products: state.products,
    });
  });
  
  useSalesStore.subscribe((state) => {
    useStore.setState({
      sales: state.sales,
      cart: state.cart,
    });
  });
  
  useTableStore.subscribe((state) => {
    useStore.setState({
      tables: state.tables,
    });
  });
}
