
import { create } from 'zustand';
import { Table, TableStatus, CartItem, Product, PaymentMethod, Sale } from '../types';

interface TableState {
  tables: Table[];
  addToTable: (tableNumber: number, product: Product, quantity?: number) => void;
  removeFromTable: (tableNumber: number, productId: string) => void;
  updateTableQuantity: (tableNumber: number, productId: string, quantity: number) => void;
  updateTableStatus: (tableNumber: number, status: TableStatus) => void;
  clearTable: (tableNumber: number) => void;
  completeTableSale: (tableNumber: number, paymentMethod: PaymentMethod, discount: number, discountType: 'value' | 'percentage') => void;
  completeTableSaleWithSplit: (tableNumber: number, payments: Array<{method: PaymentMethod, amount: number}>, discount: number, discountType: 'value' | 'percentage') => void;
}

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

export const useTableStore = create<TableState>((set, get) => ({
  tables: initializeTables(),
  addToTable: (tableNumber, product, quantity = 1) => {
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
    // Implementation would need access to other stores
    console.log('Complete table sale', { tableNumber, paymentMethod, discount, discountType });
  },
  completeTableSaleWithSplit: (tableNumber, payments, discount, discountType) => {
    // Implementation would need access to other stores
    console.log('Complete table sale with split', { tableNumber, payments, discount, discountType });
  },
}));
