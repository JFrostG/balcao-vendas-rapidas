
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Table, CartItem, PaymentMethod } from '../types';
import { useSalesStore } from './salesStore';

interface TableState {
  tables: Table[];
  addOrderToTable: (tableNumber: number, item: CartItem) => void;
  removeOrderFromTable: (tableNumber: number, itemIndex: number) => void;
  updateOrderQuantity: (tableNumber: number, itemIndex: number, quantity: number) => void;
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
      
      addOrderToTable: (tableNumber, item) => {
        set((state) => {
          const existingTable = state.tables.find(t => t.id === tableNumber);
          
          if (existingTable) {
            const existingOrder = existingTable.orders.find(order => 
              order.productId === item.productId
            );
            
            if (existingOrder) {
              return {
                tables: state.tables.map(table =>
                  table.id === tableNumber
                    ? {
                        ...table,
                        orders: table.orders.map(order =>
                          order.productId === item.productId
                            ? {
                                ...order,
                                quantity: order.quantity + item.quantity,
                                subtotal: (order.quantity + item.quantity) * order.price
                              }
                            : order
                        ),
                        total: table.orders.reduce((sum, order) => 
                          order.productId === item.productId 
                            ? sum + ((order.quantity + item.quantity) * order.price)
                            : sum + order.subtotal
                        , 0)
                      }
                    : table
                )
              };
            } else {
              return {
                tables: state.tables.map(table =>
                  table.id === tableNumber
                    ? {
                        ...table,
                        orders: [...table.orders, item],
                        total: table.total + item.subtotal
                      }
                    : table
                )
              };
            }
          } else {
            const newTable: Table = {
              id: tableNumber,
              orders: [item],
              total: item.subtotal,
              isOccupied: true
            };
            return {
              tables: [...state.tables, newTable]
            };
          }
        });

        // Registrar a venda individual no salesStore
        const salesStore = useSalesStore.getState();
        salesStore.completeSale('dinheiro', 0, 'value', tableNumber);
      },

      removeOrderFromTable: (tableNumber, itemIndex) => {
        set((state) => ({
          tables: state.tables.map(table =>
            table.id === tableNumber
              ? {
                  ...table,
                  orders: table.orders.filter((_, index) => index !== itemIndex),
                  total: table.orders
                    .filter((_, index) => index !== itemIndex)
                    .reduce((sum, order) => sum + order.subtotal, 0)
                }
              : table
          ).filter(table => table.orders.length > 0)
        }));
      },

      updateOrderQuantity: (tableNumber, itemIndex, quantity) => {
        if (quantity <= 0) {
          get().removeOrderFromTable(tableNumber, itemIndex);
          return;
        }

        set((state) => ({
          tables: state.tables.map(table =>
            table.id === tableNumber
              ? {
                  ...table,
                  orders: table.orders.map((order, index) =>
                    index === itemIndex
                      ? { ...order, quantity, subtotal: quantity * order.price }
                      : order
                  ),
                  total: table.orders
                    .map((order, index) =>
                      index === itemIndex
                        ? { ...order, quantity, subtotal: quantity * order.price }
                        : order
                    )
                    .reduce((sum, order) => sum + order.subtotal, 0)
                }
              : table
          )
        }));
      },

      clearTable: (tableNumber) => {
        set((state) => ({
          tables: state.tables.filter(table => table.id !== tableNumber)
        }));
      },

      completeTableSale: (tableNumber, paymentMethod) => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table) return;

        // Registrar a venda completa no salesStore
        const salesStore = useSalesStore.getState();
        
        // Limpar o carrinho primeiro para evitar conflitos
        salesStore.clearCart();
        
        // Adicionar todos os itens da mesa ao carrinho
        table.orders.forEach(order => {
          const product = {
            id: order.productId,
            name: order.productName,
            price: order.price
          };
          salesStore.addToCart(product, order.quantity);
        });

        // Completar a venda
        salesStore.completeSale(paymentMethod, 0, 'value', tableNumber);

        // Limpar a mesa
        get().clearTable(tableNumber);
      },

      completeTableSaleWithSplit: (tableNumber, payments) => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table) return;

        // Para pagamento dividido, registrar como uma única venda com o método principal
        const primaryPayment = payments[0];
        if (primaryPayment) {
          get().completeTableSale(tableNumber, primaryPayment.method);
        }
      },

      completePartialPayment: (tableNumber, paymentMethod, amount) => {
        set((state) => {
          const table = state.tables.find(t => t.id === tableNumber);
          if (!table) return state;

          const newTotal = Math.max(0, table.total - amount);
          
          if (newTotal === 0) {
            // Se o pagamento parcial cobriu o total, completar a venda
            setTimeout(() => {
              get().completeTableSale(tableNumber, paymentMethod);
            }, 0);
            return state;
          }

          // Registrar o pagamento parcial como uma venda separada
          const salesStore = useSalesStore.getState();
          salesStore.clearCart();
          
          // Criar um item representando o pagamento parcial
          const partialPaymentItem = {
            id: `partial-${Date.now()}`,
            name: `Pagamento Parcial - ${tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`}`,
            price: amount
          };
          
          salesStore.addToCart(partialPaymentItem, 1);
          salesStore.completeSale(paymentMethod, 0, 'value', tableNumber);

          return {
            tables: state.tables.map(table =>
              table.id === tableNumber
                ? { ...table, total: newTotal }
                : table
            )
          };
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
