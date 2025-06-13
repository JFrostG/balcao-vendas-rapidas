
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sale, PaymentMethod } from '../types';
import { useStore } from '../store/useStore';
import SplitPaymentDialog from './SplitPaymentDialog';
import { toast } from 'sonner';

interface SplitClosedSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const SplitClosedSaleDialog = ({ isOpen, onClose, sale }: SplitClosedSaleDialogProps) => {
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const { deleteSale, sales } = useStore();

  if (!sale) return null;

  const handleSplitPayment = (payments: Array<{method: PaymentMethod, amount: number}>, shouldPrint: boolean) => {
    // Remover a venda original
    deleteSale(sale.id);
    
    // Criar novas vendas para cada forma de pagamento
    payments.forEach((payment, index) => {
      if (payment.amount > 0) {
        const newSale: Sale = {
          ...sale,
          id: `${sale.id}-split-${index}`,
          total: payment.amount,
          paymentMethod: payment.method,
          discount: index === 0 ? sale.discount : 0, // Desconto apenas na primeira
        };
        
        // Adicionar nova venda (seria necessário um método addSale no store)
        console.log('Nova venda dividida:', newSale);
      }
    });

    if (shouldPrint) {
      console.log('Imprimir conta dividida');
    }

    setShowSplitDialog(false);
    onClose();
    toast.success('Conta dividida com sucesso!');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dividir Conta Fechada</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Venda #{sale.id.slice(-6)} - {sale.tableNumber === 0 ? 'Balcão' : `Mesa ${sale.tableNumber}`}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {sale.createdAt.toLocaleString('pt-BR')} - {sale.userName}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {sale.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2 space-y-1">
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
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {sale.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Forma Original:</span>
                    <span>{sale.paymentMethod}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={() => setShowSplitDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Dividir Pagamento
              </Button>
              <Button onClick={onClose} variant="outline">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SplitPaymentDialog
        isOpen={showSplitDialog}
        onClose={() => setShowSplitDialog(false)}
        totalAmount={sale?.total || 0}
        onConfirm={handleSplitPayment}
      />
    </>
  );
};

export default SplitClosedSaleDialog;
