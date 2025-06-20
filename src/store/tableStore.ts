
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Table, TableStatus, Product, PaymentMethod } from '../types';
import { useSalesStore } from './salesStore';

interface TableState {
  tables: Table[];
  addToTable: (tableNumber: number, product: Product, quantity?: number) => void;
  removeFromTable: (tableNumber: number, productId: string) => void;
  updateTableQuantity: (tableNumber: number, productId: string, quantity: number) => void;
  updateTableStatus: (tableNumber: number, status: TableStatus) => void;
  clearTable: (tableNumber: number) => void;
  completeTableSale: (tableNumber: number, paymentMethod: PaymentMethod, discount?: number, discountType?: 'value' | 'percentage') => void;
  completeTableSaleWithSplit: (tableNumber: number, payments: Array<{method: PaymentMethod, amount: number}>, discount?: number, discountType?: 'value' | 'percentage') => void;
  getTableTotal: (tableNumber: number) => number;
}

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        status: 'available' as TableStatus,
        orders: [],
        total: 0,
      })),

      addToTable: (tableNumber, product, quantity = 1) => {
        set((state) => ({
          tables: state.tables.map(table => {
            if (table.id === tableNumber) {
              const existingItem = table.orders.find(item => item.productId === product.id);
              const updatedOrders = existingItem
                ? table.orders.map(item =>
                    item.productId === product.id
                      ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price }
                      : item
                  )
                : [...table.orders, {
                    productId: product.id,
                    productName: product.name,
                    price: product.price,
                    quantity,
                    subtotal: product.price * quantity,
                  }];
              
              const newTotal = updatedOrders.reduce((sum, item) => sum + item.subtotal, 0);
              
              return {
                ...table,
                orders: updatedOrders,
                total: newTotal,
                status: 'occupied' as TableStatus,
              };
            }
            return table;
          }),
        }));
      },

      removeFromTable: (tableNumber, productId) => {
        set((state) => ({
          tables: state.tables.map(table => {
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
          }),
        }));
      },

      updateTableQuantity: (tableNumber, productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromTable(tableNumber, productId);
          return;
        }
        
        set((state) => ({
          tables: state.tables.map(table => {
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
          }),
        }));
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
              ? { ...table, orders: [], total: 0, status: 'available' as TableStatus }
              : table
          ),
        }));
      },

      completeTableSale: (tableNumber, paymentMethod, discount = 0, discountType = 'value') => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table || table.orders.length === 0) return;

        // Registrar venda no salesStore
        const subtotal = table.total;
        const discountAmount = discountType === 'percentage' 
          ? (subtotal * discount) / 100 
          : discount;
        const total = Math.max(0, subtotal - discountAmount);

        const salesStore = useSalesStore.getState();
        salesStore.completeSale(paymentMethod, discount, discountType, tableNumber);

        console.log('Venda da mesa registrada:', {
          tableNumber,
          total,
          paymentMethod,
          items: table.orders.length
        });

        // Limpar mesa
        get().clearTable(tableNumber);
      },

      completeTableSaleWithSplit: (tableNumber, payments, discount = 0, discountType = 'value') => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table || table.orders.length === 0) return;

        // Para vendas divididas, registrar cada pagamento como uma venda separada
        const salesStore = useSalesStore.getState();
        
        payments.forEach((payment, index) => {
          // Simular carrinho para cada pagamento
          const proportionalItems = table.orders.map(item => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: index === 0 ? item.quantity : 0, // Só colocar itens no primeiro pagamento para evitar duplicação
            subtotal: index === 0 ? (item.subtotal * payment.amount / table.total) : 0,
          }));

          // Adicionar itens ao carrinho temporariamente
          proportionalItems.forEach(item => {
            if (item.quantity > 0) {
              salesStore.addToCart({
                id: item.productId,
                name: item.productName,
                price: item.price,
                category: 'outro',
                available: true,
                code: item.productId
              }, item.quantity);
            }
          });

          // Completar venda
          salesStore.completeSale(payment.method, 0, 'value', tableNumber);
        });

        console.log('Venda dividida da mesa registrada:', {
          tableNumber,
          payments: payments.length,
          total: table.total
        });

        // Limpar mesa
        get().clearTable(tableNumber);
      },

      getTableTotal: (tableNumber) => {
        const table = get().tables.find(t => t.id === tableNumber);
        return table ? table.total : 0;
      },
    }),
    {
      name: 'table-storage',
    }
  )
);
