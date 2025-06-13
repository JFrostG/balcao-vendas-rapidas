
import { create } from 'zustand';
import { Product } from '../types';

interface ProductState {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

// Enhanced default products with codes
const defaultProducts: Product[] = [
  { id: '1', name: 'Big Burger', price: 25.90, category: 'hamburguer', available: true, code: '001' },
  { id: '2', name: 'Cheese Burger', price: 22.90, category: 'hamburguer', available: true, code: '002' },
  { id: '3', name: 'X-Bacon', price: 28.90, category: 'hamburguer', available: true, code: '003' },
  { id: '4', name: 'Coca-Cola 350ml', price: 6.50, category: 'bebida', available: true, code: '004' },
  { id: '5', name: 'Suco Natural', price: 8.90, category: 'bebida', available: true, code: '005' },
  { id: '6', name: 'Batata Frita', price: 12.90, category: 'acompanhamento', available: true, code: '006' },
  { id: '7', name: 'Onion Rings', price: 14.90, category: 'acompanhamento', available: true, code: '007' },
  { id: '8', name: 'Milk Shake', price: 16.90, category: 'sobremesa', available: true, code: '008' },
];

export const useProductStore = create<ProductState>((set) => ({
  products: defaultProducts,
  addProduct: (product) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      code: product.code || Date.now().toString().slice(-3),
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
}));
