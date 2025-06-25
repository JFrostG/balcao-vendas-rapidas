
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSalesStore } from '../store/salesStore';
import { useStore } from '../store/useStore';
import { PaymentMethod } from '../types';
import { Trash, Edit, Printer } from 'lucide-react';
import { toast } from 'sonner';
import SplitClosedSaleDialog from './SplitClosedSaleDialog';
import QuickPaymentButtons from './QuickPaymentButtons';

const SalesView = () => {
  const salesStore = useSalesStore();
  const { currentShift } = useStore();
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [splitSale, setSplitSale] = useState<any>(null);

  // Usar as vendas diretamente do salesStore
  const allSales = salesStore.sales;
  
  // Filtrar vendas do turno atual se houver turno ativo
  const currentShiftSales = currentShift?.isActive ? 
    allSales.filter(sale => sale.shiftId === currentShift.id) : 
    allSales;

  const handleDeleteSale = (saleId: string) => {
    salesStore.deleteSale(saleId);
    toast.success('Venda excluída com sucesso!');
  };

  const handleUpdatePaymentMethod = (saleId: string) => {
    salesStore.updateSalePaymentMethod(saleId, newPaymentMethod);
    setEditingSale(null);
    toast.success('Forma de pagamento atualizada!');
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setNewPaymentMethod(method);
    if (editingSale) {
      handleUpdatePaymentMethod(editingSale);
    }
  };

  const getTableName = (tableNumber?: number) => {
    if (tableNumber === 0) return 'Balcão';
    if (tableNumber) return `Mesa ${tableNumber}`;
    return 'Balcão';
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels = {
      dinheiro: 'Dinheiro',
      debito: 'Cartão Débito',
      credito: 'Cartão Crédito',
      pix: 'PIX',
      cortesia: 'Cortesia'
    };
    return labels[method];
  };

  const totalSales = currentShiftSales.reduce((sum, sale) => sum + sale.total, 0);

  console.log('SalesView - Total sales in store:', allSales.length);
  console.log('SalesView - Current shift sales:', currentShiftSales.length);
  console.log('SalesView - Current shift active:', currentShift?.isActive);
  console.log('SalesView - All sales:', allSales);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendas {currentShift?.isActive ? 'do Turno' : 'Históricas'}</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Relatório
          </Button>
          <div className="text-lg font-semibold text-green-600">
            Total: R$ {totalSales.toFixed(2)}
          </div>
        </div>
      </div>

      {currentShiftSales.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {currentShift?.isActive ? 'Nenhuma venda registrada no turno atual' : 'Nenhuma venda encontrada'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Total de vendas no sistema: {allSales.length}
            </p>
            {currentShift?.isActive && (
              <p className="text-sm text-green-600 mt-1">
                Turno ativo: {currentShift.userName}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentShiftSales.map((sale) => (
            <Card key={sale.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Venda #{sale.id.slice(-6)} - {getTableName(sale.tableNumber)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString('pt-BR')} - {sale.userName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSplitSale(sale)}
                    >
                      Dividir Conta
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSale(sale.id);
                        setNewPaymentMethod(sale.paymentMethod);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir venda?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A venda será permanentemente removida.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteSale(sale.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Itens:</h4>
                      <div className="space-y-1">
                        {sale.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.productName}
                              {item.isCourtesy && <span className="text-orange-600 ml-1">(Cortesia)</span>}
                            </span>
                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {(sale.total + (sale.discount || 0)).toFixed(2)}</span>
                      </div>
                      {sale.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Desconto:</span>
                          <span>- R$ {sale.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>R$ {sale.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pagamento:</span>
                        <span className="font-medium">{getPaymentMethodLabel(sale.paymentMethod)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para editar forma de pagamento */}
      <AlertDialog open={editingSale !== null} onOpenChange={() => setEditingSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Forma de Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione a nova forma de pagamento para esta venda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <QuickPaymentButtons onPaymentSelect={handlePaymentSelect} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SplitClosedSaleDialog
        isOpen={splitSale !== null}
        onClose={() => setSplitSale(null)}
        sale={splitSale}
      />
    </div>
  );
};

export default SalesView;
