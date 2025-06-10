
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Shift, Product, Sale, CartItem, PaymentMethod } from '../types';

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
  
  // Utils
  getCartTotal: () => number;
  getCurrentShiftSales: () => Sale[];
  getPaymentBreakdown: (sales: Sale[]) => any;
}

// Default users for demo
const defaultUsers: User[] = [
  { id: '1', username: 'admin', name: 'Administrador', role: 'admin' },
  { id: '2', username: 'caixa1', name: 'João Silva', role: 'cashier' },
  { id: '3', username: 'caixa2', name: 'Maria Santos', role: 'cashier' },
];

// Default products for demo
const defaultProducts: Product[] = [
  { id: '1', name: 'Big Burger', price: 25.90, category: 'hamburguer', available: true },
  { id: '2', name: 'Cheese Burger', price: 22.90, category: 'hamburguer', available: true },
  { id: '3', name: 'X-Bacon', price: 28.90, category: 'hamburguer', available: true },
  { id: '4', name: 'Coca-Cola 350ml', price: 6.50, category: 'bebida', available: true },
  { id: '5', name: 'Suco Natural', price: 8.90, category: 'bebida', available: true },
  { id: '6', name: 'Batata Frita', price: 12.90, category: 'acompanhamento', available: true },
  { id: '7', name: 'Onion Rings', price: 14.90, category: 'acompanhamento', available: true },
  { id: '8', name: 'Milk Shake', price: 16.90, category: 'sobremesa', available: true },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      // Shift
      currentShift: null,
      shifts: [],
      openShift: (user) => {
        // Fechar qualquer turno ativo antes de abrir novo
        const { shifts, sales } = get();
        const activeShift = shifts.find(shift => shift.isActive);
        
        let updatedShifts = shifts;
        if (activeShift) {
          const shiftSales = sales.filter(sale => sale.shiftId === activeShift.id);
          const totalSales = shiftSales.reduce((sum, sale) => sum + sale.total, 0);
          const totalItems = shiftSales.reduce((sum, sale) => 
            sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
          );
          
          const paymentBreakdown = get().getPaymentBreakdown(shiftSales);
          
          const closedShift: Shift = {
            ...activeShift,
            endTime: new Date(),
            isActive: false,
            totalSales,
            totalItems,
            paymentBreakdown,
          };
          
          updatedShifts = shifts.map(shift => 
            shift.id === activeShift.id ? closedShift : shift
          );
        }
        
        const newShift: Shift = {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          startTime: new Date(),
          isActive: true,
          totalSales: 0,
          totalItems: 0,
          paymentBreakdown: {
            dinheiro: 0,
            debito: 0,
            credito: 0,
            pix: 0,
            cortesia: 0,
          },
        };
        
        set({
          currentShift: newShift,
          shifts: [...updatedShifts, newShift],
        });
      },
      closeShift: () => {
        const { currentShift, sales } = get();
        if (!currentShift) return;
        
        const shiftSales = sales.filter(sale => sale.shiftId === currentShift.id);
        const totalSales = shiftSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalItems = shiftSales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );
        
        const paymentBreakdown = get().getPaymentBreakdown(shiftSales);
        
        const updatedShift: Shift = {
          ...currentShift,
          endTime: new Date(),
          isActive: false,
          totalSales,
          totalItems,
          paymentBreakdown,
        };
        
        set((state) => ({
          currentShift: null,
          shifts: state.shifts.map(shift => 
            shift.id === currentShift.id ? updatedShift : shift
          ),
        }));
      },
      
      // Products
      products: defaultProducts,
      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: Date.now().toString(),
        };
        set((state) => ({
          products: [...state.products, newProduct],
        }));
      },
      updateProduct: (id, productData) => {
        set((state) => ({
          products: state.products.map(product =>
            product.id === id ? { ...product, ...productData } : product
          ),
        }));
      },
      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter(product => product.id !== id),
        }));
      },
      
      // Sales
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
        const { cart, currentShift, currentUser } = get();
        if (!currentShift || !currentUser || cart.length === 0) return;
        
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
          shiftId: currentShift.id,
          userId: currentUser.id,
          userName: currentUser.name,
          createdAt: new Date(),
        };
        
        set((state) => ({
          sales: [...state.sales, newSale],
          cart: [],
        }));
      },
      
      // Utils
      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.subtotal, 0);
      },
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
      }),
    }
  )
);

// Initialize default users (not persisted for security)
if (typeof window !== 'undefined') {
  (window as any).defaultUsers = defaultUsers;
}
