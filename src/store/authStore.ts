
import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

// Default users for demo
const defaultUsers: User[] = [
  { id: '1', username: 'admin', name: 'Administrador', role: 'admin' },
  { id: '2', username: 'caixa1', name: 'João Silva', role: 'cashier' },
  { id: '3', username: 'caixa2', name: 'Maria Santos', role: 'cashier' },
];

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  users: defaultUsers,
  setCurrentUser: (user) => set({ currentUser: user }),
  addUser: (user) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
    };
    set((state) => ({
      users: [...state.users, newUser],
    }));
  },
  updateUser: (id, userData) => {
    set((state) => ({
      users: state.users.map(user =>
        user.id === id ? { ...user, ...userData } : user
      ),
    }));
  },
  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter(user => user.id !== id),
    }));
  },
}));

// Initialize default users (not persisted for security)
if (typeof window !== 'undefined') {
  (window as any).defaultUsers = defaultUsers;
}
