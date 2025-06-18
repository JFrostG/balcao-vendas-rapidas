
import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  addUser: (user: Omit<User, 'id'> & { password?: string }) => void;
  updateUser: (id: string, user: Partial<User> & { password?: string }) => void;
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
  addUser: (userData) => {
    const { password, ...user } = userData;
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
    };
    
    // Em um app real, a senha seria hashada e armazenada de forma segura
    // Por enquanto, apenas armazenamos no localStorage para demonstração
    if (password) {
      localStorage.setItem(`user_password_${newUser.id}`, password);
    }
    
    set((state) => ({
      users: [...state.users, newUser],
    }));
  },
  updateUser: (id, userData) => {
    const { password, ...userDataWithoutPassword } = userData;
    
    // Atualizar senha se fornecida
    if (password) {
      localStorage.setItem(`user_password_${id}`, password);
    }
    
    set((state) => ({
      users: state.users.map(user =>
        user.id === id ? { ...user, ...userDataWithoutPassword } : user
      ),
    }));
  },
  deleteUser: (id) => {
    // Remover senha do localStorage
    localStorage.removeItem(`user_password_${id}`);
    
    set((state) => ({
      users: state.users.filter(user => user.id !== id),
    }));
  },
}));

// Initialize default users (not persisted for security)
if (typeof window !== 'undefined') {
  (window as any).defaultUsers = defaultUsers;
  
  // Definir senhas padrão para usuários demo
  localStorage.setItem('user_password_1', 'admin');
  localStorage.setItem('user_password_2', '1234');
  localStorage.setItem('user_password_3', '1234');
}
