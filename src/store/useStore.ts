
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

// Initialize tables 1-15 + balcão (id: 0)
const initializeTables = (): Table[] => {
  const regularTables = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    status: 'available' as TableStatus,
    orders: [],
    total: 0,
  }));
  
  const balcao: Table = {
    id: 0,
    status: 'available' as TableStatus,
    orders: [],
    total: 0,
  };
  
  return [balcao, ...regularTables];
};

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
        // Garantir que apenas um turno esteja ativo - fechar qualquer turno ativo
        const { shifts, sales } = get();
        const activeShifts = shifts.filter(shift => shift.isActive);
        
        let updatedShifts = shifts;
        
        // Fechar todos os turnos ativos
        activeShifts.forEach(activeShift => {
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
          
          updatedShifts = updatedShifts.map(shift => 
            shift.id === activeShift.id ? closedShift : shift
          );
        });
        
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
        const { currentShift } = get();
        if (!currentShift?.isActive) {
          return; // Bloquear sem turno ativo
        }
        
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
          tableNumber: 0, // Balcão
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
      
      // Tables
      tables: initializeTables(),
      addToTable: (tableNumber, product, quantity = 1) => {
        const { currentShift } = get();
        if (!currentShift?.isActive) {
          return; // Bloquear sem turno ativo
        }
        
        set((state) => {
          const updatedTables = state.tables.map(table => {
            if (table.id === tableNumber) {
              const existingItem = table.orders.find(item => item.productId === product.id);
              
              let updatedOrders;
              if (existingItem) {
                updatedOrders = table.orders.map(item =>
                  item.productId === product.id
                    ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price }
                    : item
                );
              } else {
                const newItem: CartItem = {
                  productId: product.id,
                  productName: product.name,
                  price: product.price,
                  quantity,
                  subtotal: product.price * quantity,
                };
                updatedOrders = [...table.orders, newItem];
              }
              
              const newTotal = updatedOrders.reduce((sum, item) => sum + item.subtotal, 0);
              
              return {
                ...table,
                orders: updatedOrders,
                total: newTotal,
                status: 'occupied' as TableStatus,
              };
            }
            return table;
          });
          
          return { tables: updatedTables };
        });
      },
      removeFromTable: (tableNumber, productId) => {
        set((state) => {
          const updatedTables = state.tables.map(table => {
            if (table.id === tableNumber) {
              const updatedOrders = table.orders.filter(item => item.productId !== productId);
              const newTotal = updatedOrders.reduce((sum, item) => sum + item.subtotal, 0);
              
              return {
                ...table,
                orders: updatedOrders,
                total: newTotal,
                status: updatedOrders.length === 0 ? 'available' as TableStatus : table.status,
              };
            }
            return table;
          });
          
          return { tables: updatedTables };
        });
      },
      updateTableQuantity: (tableNumber, productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromTable(tableNumber, productId);
          return;
        }
        
        set((state) => {
          const updatedTables = state.tables.map(table => {
            if (table.id === tableNumber) {
              const updatedOrders = table.orders.map(item =>
                item.productId === productId
                  ? { ...item, quantity, subtotal: quantity * item.price }
                  : item
              );
              const newTotal = updatedOrders.reduce((sum, item) => sum + item.subtotal, 0);
              
              return {
                ...table,
                orders: updatedOrders,
                total: newTotal,
              };
            }
            return table;
          });
          
          return { tables: updatedTables };
        });
      },
      updateTableStatus: (tableNumber, status) => {
        set((state) => ({
          tables: state.tables.map(table =>
            table.id === tableNumber ? { ...table, status } : table
          ),
        }));
      },
      clearTable: (tableNumber) => {
        set((state) => ({
          tables: state.tables.map(table =>
            table.id === tableNumber 
              ? { ...table, status: 'available' as TableStatus, orders: [], total: 0 }
              : table
          ),
        }));
      },
      completeTableSale: (tableNumber, paymentMethod, discount, discountType) => {
        const { tables, currentShift, currentUser } = get();
        const table = tables.find(t => t.id === tableNumber);
        
        if (!table || !currentShift || !currentUser || table.orders.length === 0) return;
        
        const subtotal = table.total;
        const discountAmount = discountType === 'percentage' 
          ? (subtotal * discount) / 100 
          : discount;
        const total = Math.max(0, subtotal - discountAmount);
        
        const newSale: Sale = {
          id: Date.now().toString(),
          items: table.orders.map(item => ({
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
          tableNumber,
        };
        
        set((state) => ({
          sales: [...state.sales, newSale],
        }));
      },
      completeTableSaleWithSplit: (tableNumber, payments, discount, discountType) => {
        const { tables, currentShift, currentUser } = get();
        const table = tables.find(t => t.id === tableNumber);
        
        if (!table || !currentShift || !currentUser || table.orders.length === 0) return;
        
        const subtotal = table.total;
        const discountAmount = discountType === 'percentage' 
          ? (subtotal * discount) / 100 
          : discount;
        const total = Math.max(0, subtotal - discountAmount);
        
        // Criar uma venda para cada forma de pagamento
        payments.forEach((payment, index) => {
          if (payment.amount > 0) {
            const saleTotal = payment.amount;
            const newSale: Sale = {
              id: `${Date.now()}-${index}`,
              items: table.orders.map(item => ({
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                isCourtesy: payment.method === 'cortesia',
              })),
              total: saleTotal,
              paymentMethod: payment.method,
              discount: index === 0 ? discountAmount : 0, // Aplicar desconto apenas na primeira venda
              discountType,
              shiftId: currentShift.id,
              userId: currentUser.id,
              userName: currentUser.name,
              createdAt: new Date(),
              tableNumber,
            };
            
            set((state) => ({
              sales: [...state.sales, newSale],
            }));
          }
        });
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
        tables: state.tables,
      }),
    }
  )
);

// Initialize default users (not persisted for security)
if (typeof window !== 'undefined') {
  (window as any).defaultUsers = defaultUsers;
}
