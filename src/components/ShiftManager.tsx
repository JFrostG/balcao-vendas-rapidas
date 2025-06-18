
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useStore } from '../store/useStore';
import { Clock, DollarSign, ShoppingBag, LogOut, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const ShiftManager = () => {
  const { 
    currentUser, 
    currentShift, 
    shifts,
    openShift, 
    closeShift, 
    getCurrentShiftSales,
    getPaymentBreakdown,
    setCurrentUser 
  } = useStore();

  // Verificar se há outro turno ativo
  const activeShifts = shifts.filter(shift => shift.isActive && shift.id !== currentShift?.id);
  const hasOtherActiveShift = activeShifts.length > 0;

  const handleOpenShift = () => {
    if (!currentUser) return;
    
    if (hasOtherActiveShift) {
      toast.warning('Existe outro turno ativo. Ele será fechado automaticamente.');
    }
    
    openShift(currentUser);
    toast.success('Turno aberto com sucesso!');
  };

  const handleCloseShift = () => {
    closeShift();
    toast.success('Turno fechado com sucesso!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast.success('Logout realizado com sucesso');
  };

  const handleForceLogout = () => {
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
            {hasOtherActiveShift && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Atenção!</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Existe {activeShifts.length} turno(s) ativo(s) de outro(s) usuário(s). 
                  Ao abrir seu turno, o(s) turno(s) ativo(s) será(ão) fechado(s) automaticamente.
                </p>
                <div className="mt-2 text-xs text-yellow-600">
                  {activeShifts.map(shift => (
                    <div key={shift.id}>
                      • {shift.userName} - {new Date(shift.startTime).toLocaleString('pt-BR')}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-center space-y-2">
              <Clock className="w-12 h-12 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
            
            <Button onClick={handleOpenShift} className="w-full" size="lg">
              {hasOtherActiveShift ? 'Fechar Outros Turnos e Abrir Meu Turno' : 'Abrir Turno'}
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
          {hasOtherActiveShift && (
            <p className="text-sm text-yellow-600 mt-1">
              ⚠️ Atenção: Existem outros turnos ativos no sistema
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Fechar Turno
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Fechar turno?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja fechar o turno? Esta ação encerrará suas atividades de vendas.
                  <br /><br />
                  <strong>Resumo do turno:</strong>
                  <br />• Total vendido: R$ {totalSales.toFixed(2)}
                  <br />• Vendas realizadas: {shiftSales.length}
                  <br />• Itens vendidos: {totalItems}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCloseShift}>
                  Fechar Turno
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sair sem fechar turno?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você tem um turno ativo. Deseja sair mesmo assim? O turno continuará ativo e você poderá retornar mais tarde.
                  <br /><br />
                  <strong>Importante:</strong> Outros usuários não poderão abrir novos turnos enquanto este estiver ativo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleForceLogout}>
                  Sair mesmo assim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
