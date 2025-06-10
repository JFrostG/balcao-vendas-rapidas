
import { Button } from '@/components/ui/button';
import { useStore } from '../store/useStore';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Clock, 
  LogOut,
  History
} from 'lucide-react';
import { toast } from 'sonner';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const { currentUser, currentShift, closeShift, setCurrentUser } = useStore();

  const handleCloseShift = () => {
    closeShift();
    toast.success('Turno fechado com sucesso!');
  };

  const handleLogout = () => {
    if (currentShift?.isActive) {
      toast.error('Feche o turno antes de sair');
      return;
    }
    setCurrentUser(null);
    toast.success('Logout realizado com sucesso');
  };

  const navItems = [
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'shift-history', label: 'Histórico', icon: History },
    { id: 'shift', label: 'Turno', icon: Clock },
  ];

  return (
    <nav className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div>
            <h1 className="text-xl font-bold text-primary">Burger PDV</h1>
            {currentShift?.isActive && (
              <p className="text-sm text-muted-foreground">
                Turno: {currentUser?.name}
              </p>
            )}
          </div>
          
          <div className="flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  onClick={() => onViewChange(item.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentShift?.isActive && (
            <Button onClick={handleCloseShift} variant="outline" size="sm">
              Fechar Turno
            </Button>
          )}
          <Button onClick={handleLogout} variant="ghost" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
