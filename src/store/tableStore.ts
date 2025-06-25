
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Table, CartItem, PaymentMethod, Product } from '../types';
import { useSalesStore } from './salesStore';

interface TableState {
  tables: Table[];
  addOrderToTable: (tableNumber: number, item: CartItem) => void;
  addProductToTable: (tableNumber: number, product: Product, quantity?: number) => void;
  removeOrderFromTable: (tableNumber: number, itemIndex: number) => void;
  removeProductFromTable: (tableNumber: number, productId: string) => void;
  updateOrderQuantity: (tableNumber: number, itemIndex: number, quantity: number) => void;
  updateProductQuantity: (tableNumber: number, productId: string, quantity: number) => void;
  updateTableStatus: (tableNumber: number, status: 'available' | 'occupied' | 'requesting-bill') => void;
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
                        total: table.total + item.subtotal,
                        status: 'occupied' as const
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
              status: 'occupied'
            };
            return {
              tables: [...state.tables, newTable]
            };
          }
        });
      },

      addProductToTable: (tableNumber, product, quantity = 1) => {
        const item: CartItem = {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity,
          subtotal: product.price * quantity,
        };
        get().addOrderToTable(tableNumber, item);
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
                    .reduce((sum, order) => sum + order.subtotal, 0),
                  status: table.orders.filter((_, index) => index !== itemIndex).length === 0 
                    ? 'available' as const 
                    : table.status
                }
              : table
          ).filter(table => table.orders.length > 0 || table.status !== 'available')
        }));
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
                  status: table.orders.filter(order => order.productId !== productId).length === 0 
                    ? 'available' as const 
                    : table.status
                }
              : table
          ).filter(table => table.orders.length > 0 || table.status !== 'available')
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
                    .reduce((sum, order) => sum + order.subtotal, 0)
                }
              : table
          )
        }));
      },

      updateTableStatus: (tableNumber, status) => {
        set((state) => {
          const existingTable = state.tables.find(t => t.id === tableNumber);
          
          if (existingTable) {
            return {
              tables: state.tables.map(table =>
                table.id === tableNumber ? { ...table, status } : table
              )
            };
          } else if (status !== 'available') {
            // Criar mesa se não existir e o status não for available
            const newTable: Table = {
              id: tableNumber,
              orders: [],
              total: 0,
              status
            };
            return {
              tables: [...state.tables, newTable]
            };
          }
          
          return state;
        });
      },

      clearTable: (tableNumber) => {
        set((state) => ({
          tables: state.tables.filter(table => table.id !== tableNumber)
        }));
      },

      completeTableSale: (tableNumber, paymentMethod) => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table || table.orders.length === 0) return;

        // Registrar a venda no salesStore
        const salesStore = useSalesStore.getState();
        
        // Limpar o carrinho primeiro
        salesStore.clearCart();
        
        // Adicionar todos os itens da mesa ao carrinho
        table.orders.forEach(order => {
          const product = {
            id: order.productId,
            name: order.productName,
            price: order.price,
            category: 'outro' as const,
            available: true,
            code: order.productId
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
        if (!table || payments.length === 0) return;

        // Para pagamento dividido, usar o método principal
        const primaryPayment = payments[0];
        if (primaryPayment) {
          get().completeTableSale(tableNumber, primaryPayment.method);
        }
      },

      completePartialPayment: (tableNumber, paymentMethod, amount) => {
        const table = get().tables.find(t => t.id === tableNumber);
        if (!table) return;

        const newTotal = Math.max(0, table.total - amount);
        
        // Registrar o pagamento parcial como uma venda separada
        const salesStore = useSalesStore.getState();
        salesStore.clearCart();
        
        // Criar um produto representando o pagamento parcial
        const partialPaymentProduct = {
          id: `partial-${Date.now()}`,
          name: `Pagamento Parcial - ${tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`}`,
          price: amount,
          category: 'outro' as const,
          available: true,
          code: `partial-${Date.now()}`
        };
        
        salesStore.addToCart(partialPaymentProduct, 1);
        salesStore.completeSale(paymentMethod, 0, 'value', tableNumber);

        if (newTotal === 0) {
          // Se zerou, limpar a mesa
          get().clearTable(tableNumber);
        } else {
          // Atualizar o total da mesa
          set((state) => ({
            tables: state.tables.map(table =>
              table.id === tableNumber
                ? { ...table, total: newTotal }
                : table
            )
          }));
        }
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
