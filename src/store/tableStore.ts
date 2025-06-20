
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
  completePartialPayment: (tableNumber: number, paymentMethod: PaymentMethod, amount: number) => void;
  getTableTotal: (tableNumber: number) => number;
}

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      // Incluir balcão (mesa 0) + 20 mesas regulares
      tables: [
        { id: 0, status: 'available' as TableStatus, orders: [], total: 0 }, // Balcão
        ...Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          status: 'available' as TableStatus,
          orders: [],
          total: 0,
        }))
      ],

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

        console.log(`Produto adicionado - ${tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`}:`, product.name);
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

        // Registrar venda completa no salesStore
        const salesStore = useSalesStore.getState();
        
        // Limpar carrinho e adicionar todos os itens da mesa
        salesStore.clearCart();
        table.orders.forEach(item => {
          const product = {
            id: item.productId,
            name: item.productName,
            price: item.price,
            category: 'outro' as const,
            available: true,
            code: item.productId
          };
          
          salesStore.addToCart(product, item.quantity);
        });

        // Completar venda com desconto se houver
        salesStore.completeSale(paymentMethod, discount, discountType, tableNumber);

        console.log(`Venda completa registrada - ${tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`}:`, {
          total: table.total,
          paymentMethod,
          items: table.orders.length,
          discount
        });

        // Limpar mesa
        get().clearTable(tableNumber);
      },

      completeTableSaleWithSplit: (tableNumber, payments, discount = 0, discountType = 'value') => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table || table.orders.length === 0) return;

        const salesStore = useSalesStore.getState();
        
        // Para cada pagamento, registrar uma venda proporcional
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        payments.forEach(payment => {
          // Calcular proporção dos itens para este pagamento
          const proportion = payment.amount / totalPaid;
          
          // Limpar carrinho e adicionar itens proporcionais
          salesStore.clearCart();
          table.orders.forEach(item => {
            const proportionalQuantity = Math.max(1, Math.round(item.quantity * proportion));
            const product = {
              id: item.productId,
              name: item.productName,
              price: item.price,
              category: 'outro' as const,
              available: true,
              code: item.productId
            };
            
            salesStore.addToCart(product, proportionalQuantity);
          });

          // Aplicar desconto proporcional se houver
          const proportionalDiscount = discount * proportion;
          salesStore.completeSale(payment.method, proportionalDiscount, discountType, tableNumber);
        });

        console.log(`Venda dividida registrada - ${tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`}:`, {
          payments: payments.length,
          total: table.total
        });

        // Limpar mesa
        get().clearTable(tableNumber);
      },

      completePartialPayment: (tableNumber, paymentMethod, amount) => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table || table.orders.length === 0 || amount <= 0) return;

        const salesStore = useSalesStore.getState();
        
        // Calcular proporção do pagamento parcial
        const proportion = Math.min(1, amount / table.total);
        
        // Limpar carrinho e adicionar itens proporcionais
        salesStore.clearCart();
        table.orders.forEach(item => {
          const partialQuantity = Math.max(1, Math.ceil(item.quantity * proportion));
          const product = {
            id: item.productId,
            name: item.productName,
            price: item.price,
            category: 'outro' as const,
            available: true,
            code: item.productId
          };
          
          salesStore.addToCart(product, partialQuantity);
        });

        // Registrar venda parcial
        salesStore.completeSale(paymentMethod, 0, 'value', tableNumber);

        // Atualizar total da mesa subtraindo o valor pago
        set((state) => ({
          tables: state.tables.map(tbl => {
            if (tbl.id === tableNumber) {
              const newTotal = Math.max(0, tbl.total - amount);
              const newStatus = newTotal === 0 ? 'available' as TableStatus : tbl.status;
              const newOrders = newTotal === 0 ? [] : tbl.orders;
              
              return {
                ...tbl,
                total: newTotal,
                status: newStatus,
                orders: newOrders
              };
            }
            return tbl;
          }),
        }));

        console.log(`Pagamento parcial registrado - ${tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`}:`, {
          amount,
          paymentMethod,
          remainingTotal: Math.max(0, table.total - amount)
        });
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
