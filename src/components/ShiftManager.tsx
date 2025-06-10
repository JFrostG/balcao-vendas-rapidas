
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '../store/useStore';
import { Clock, DollarSign, ShoppingBag, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const ShiftManager = () => {
  const { 
    currentUser, 
    currentShift, 
    openShift, 
    closeShift, 
    getCurrentShiftSales,
    getPaymentBreakdown,
    setCurrentUser 
  } = useStore();

  const handleOpenShift = () => {
    if (!currentUser) return;
    openShift(currentUser);
    toast.success('Turno aberto com sucesso!');
  };

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

  if (!currentShift?.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Abrir Turno</CardTitle>
            <CardDescription>
              Olá, {currentUser?.name}! Abra seu turno para começar as vendas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <Clock className="w-12 h-12 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
            <Button onClick={handleOpenShift} className="w-full" size="lg">
              Abrir Turno
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shiftSales = getCurrentShiftSales();
  const totalSales = shiftSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = shiftSales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  const paymentBreakdown = getPaymentBreakdown(shiftSales);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Turno Ativo</h2>
          <p className="text-muted-foreground">
            Iniciado em {currentShift.startTime.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCloseShift} variant="destructive">
            Fechar Turno
          </Button>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalSales.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shiftSales.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Dinheiro</p>
              <p className="text-lg font-semibold">R$ {paymentBreakdown.dinheiro.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Débito</p>
              <p className="text-lg font-semibold">R$ {paymentBreakdown.debito.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Crédito</p>
              <p className="text-lg font-semibold">R$ {paymentBreakdown.credito.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">PIX</p>
              <p className="text-lg font-semibold">R$ {paymentBreakdown.pix.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cortesia</p>
              <p className="text-lg font-semibold">R$ {paymentBreakdown.cortesia.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftManager;
