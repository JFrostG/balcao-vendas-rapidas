import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Table, TableStatus, Product, PaymentMethod, Sale } from '../types';
import { useSalesStore } from './salesStore';

interface TableState {
  tables: Table[];
  addProductToTable: (tableNumber: number, product: Product, quantity?: number) => void;
  removeProductFromTable: (tableNumber: number, productId: string) => void;
  updateProductQuantity: (tableNumber: number, productId: string, quantity: number) => void;
  updateTableStatus: (tableNumber: number, status: TableStatus) => void;
  clearTable: (tableNumber: number) => void;
  completeTableSale: (tableNumber: number, paymentMethod: PaymentMethod) => void;
  completeTableSaleWithSplit: (tableNumber: number, payments: Array<{method: PaymentMethod, amount: number}>) => void;
  completePartialPayment: (tableNumber: number, paymentMethod: PaymentMethod, amount: number) => void;
  getTableTotal: (tableNumber: number) => number;
}

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: [],
      
      addProductToTable: (tableNumber, product, quantity = 1) => {
        set((state) => {
          const existingTable = state.tables.find(t => t.id === tableNumber);
          
          if (existingTable) {
            const existingOrder = existingTable.orders.find(order => order.productId === product.id);
            
            if (existingOrder) {
              // Atualizar quantidade do produto existente
              const updatedOrders = existingTable.orders.map(order =>
                order.productId === product.id
                  ? { ...order, quantity: order.quantity + quantity, subtotal: (order.quantity + quantity) * order.price }
                  : order
              );
              const newTotal = updatedOrders.reduce((sum, order) => sum + order.subtotal, 0);
              
              return {
                tables: state.tables.map(t =>
                  t.id === tableNumber
                    ? { ...t, orders: updatedOrders, total: newTotal, status: 'occupied' as TableStatus }
                    : t
                ),
              };
            } else {
              // Adicionar novo produto
              const newOrder = {
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity,
                subtotal: product.price * quantity,
              };
              const updatedOrders = [...existingTable.orders, newOrder];
              const newTotal = updatedOrders.reduce((sum, order) => sum + order.subtotal, 0);
              
              return {
                tables: state.tables.map(t =>
                  t.id === tableNumber
                    ? { ...t, orders: updatedOrders, total: newTotal, status: 'occupied' as TableStatus }
                    : t
                ),
              };
            }
          } else {
            // Criar nova mesa
            const newOrder = {
              productId: product.id,
              productName: product.name,
              price: product.price,
              quantity,
              subtotal: product.price * quantity,
            };
            const newTable: Table = {
              id: tableNumber,
              status: 'occupied',
              orders: [newOrder],
              total: newOrder.subtotal,
            };
            
            return {
              tables: [...state.tables, newTable],
            };
          }
        });
      },
      
      removeProductFromTable: (tableNumber, productId) => {
        set((state) => ({
          tables: state.tables.map(table =>
            table.id === tableNumber
              ? {
                  ...table,
                  orders: table.orders.filter(order => order.productId !== productId),
                  total: table.orders
                    .filter(order => order.productId !== productId)
                    .reduce((sum, order) => sum + order.subtotal, 0),
                }
              : table
          ),
        }));
      },
      
      updateProductQuantity: (tableNumber, productId, quantity) => {
        if (quantity <= 0) {
          get().removeProductFromTable(tableNumber, productId);
          return;
        }
        
        set((state) => ({
          tables: state.tables.map(table =>
            table.id === tableNumber
              ? {
                  ...table,
                  orders: table.orders.map(order =>
                    order.productId === productId
                      ? { ...order, quantity, subtotal: quantity * order.price }
                      : order
                  ),
                  total: table.orders
                    .map(order =>
                      order.productId === productId
                        ? { ...order, quantity, subtotal: quantity * order.price }
                        : order
                    )
                    .reduce((sum, order) => sum + order.subtotal, 0),
                }
              : table
          ),
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
          tables: state.tables.filter(table => table.id !== tableNumber),
        }));
      },
      
      completeTableSale: (tableNumber, paymentMethod) => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table || table.orders.length === 0) return;
        
        // Criar a venda
        const sale: Sale = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          items: table.orders.map(order => ({
            productId: order.productId,
            productName: order.productName,
            price: order.price,
            quantity: order.quantity,
            isCourtesy: paymentMethod === 'cortesia',
          })),
          total: table.total,
          paymentMethod,
          discount: 0,
          discountType: 'value' as const,
          shiftId: 'current-shift',
          userId: 'current-user',
          userName: 'Current User',
          createdAt: new Date(),
          tableNumber,
        };
        
        // Adicionar venda ao salesStore
        useSalesStore.getState().addSale(sale);
        
        // Limpar mesa
        get().clearTable(tableNumber);
        
        console.log('Venda da mesa finalizada:', sale);
      },
      
      completeTableSaleWithSplit: (tableNumber, payments) => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table || table.orders.length === 0) return;
        
        // Criar uma venda para cada forma de pagamento
        payments.forEach((payment, index) => {
          if (payment.amount > 0) {
            const sale: Sale = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
              items: table.orders.map(order => ({
                productId: order.productId,
                productName: order.productName,
                price: order.price,
                quantity: order.quantity,
                isCourtesy: payment.method === 'cortesia',
              })),
              total: payment.amount,
              paymentMethod: payment.method,
              discount: 0,
              discountType: 'value' as const,
              shiftId: 'current-shift',
              userId: 'current-user',
              userName: 'Current User',
              createdAt: new Date(),
              tableNumber,
            };
            
            // Adicionar venda ao salesStore
            useSalesStore.getState().addSale(sale);
            console.log('Venda parcial da mesa finalizada:', sale);
          }
        });
        
        // Limpar mesa
        get().clearTable(tableNumber);
      },
      
      completePartialPayment: (tableNumber, paymentMethod, amount) => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table || table.orders.length === 0) return;
        
        // Criar a venda com o valor parcial
        const sale: Sale = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          items: table.orders.map(order => ({
            productId: order.productId,
            productName: order.productName,
            price: order.price,
            quantity: order.quantity,
            isCourtesy: paymentMethod === 'cortesia',
          })),
          total: amount,
          paymentMethod,
          discount: 0,
          discountType: 'value' as const,
          shiftId: 'current-shift',
          userId: 'current-user',
          userName: 'Current User',
          createdAt: new Date(),
          tableNumber,
        };
        
        // Adicionar venda ao salesStore
        useSalesStore.getState().addSale(sale);
        
        // Atualizar o total da mesa
        const newTotal = table.total - amount;
        if (newTotal <= 0) {
          // Se o pagamento cobriu tudo ou mais, limpar a mesa
          get().clearTable(tableNumber);
        } else {
          // Atualizar o total da mesa
          set((state) => ({
            tables: state.tables.map(t =>
              t.id === tableNumber
                ? { ...t, total: newTotal }
                : t
            ),
          }));
        }
        
        console.log('Pagamento parcial da mesa realizado:', sale);
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
