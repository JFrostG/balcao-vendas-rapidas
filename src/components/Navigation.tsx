
import { Button } from '@/components/ui/button';
import { useStore } from '../store/useStore';
import { ShoppingCart, Package, BarChart3, Clock } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const currentUser = useStore((state) => state.currentUser);

  const navItems = [
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'products', label: 'Produtos', icon: Package, adminOnly: true },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'shift', label: 'Turno', icon: Clock },
  ];

  const visibleItems = navItems.filter(item => 
    !item.adminOnly || currentUser?.role === 'admin'
  );

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "ghost"}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-2 ${
                  currentView === item.id ? 'gradient-burger text-white' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
        <div className="text-sm text-muted-foreground">
          Logado como: <span className="font-medium">{currentUser?.name}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
