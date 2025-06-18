
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '../store/useStore';
import { PaymentMethod } from '../types';
import { CreditCard, Printer, Split } from 'lucide-react';
import { toast } from 'sonner';
import SplitPaymentDialog from './SplitPaymentDialog';
import QuickPaymentButtons from './QuickPaymentButtons';

interface TableBillDialogProps {
  tableNumber: number;
  onClose: () => void;
  onPayment: (tableNumber: number) => void;
}

const TableBillDialog = ({ tableNumber, onClose, onPayment }: TableBillDialogProps) => {
  const { tables, completeTableSale, completeTableSaleWithSplit } = useStore();
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  
  const table = tables.find(t => t.id === tableNumber);
  
  if (!table) return null;

  const cartTotal = table.total;
  const finalTotal = cartTotal; // Sem desconto

  // Suporte a teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSplitDialog) return; // Não processar se split dialog estiver aberto
      
      // Teclas numéricas para pagamento
      const keyMap: {[key: string]: PaymentMethod} = {
        '1': 'dinheiro',
        '2': 'debito', 
        '3': 'credito',
        '4': 'pix',
        '5': 'cortesia'
      };
      
      if (keyMap[e.key]) {
        e.preventDefault();
        handleSimplePayment(keyMap[e.key]);
      }
      
      // Enter para dividir conta
      if (e.key === 'Enter') {
        e.preventDefault();
        setShowSplitDialog(true);
      }
      
      // Escape para fechar
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSplitDialog]);

  const handlePrintBill = () => {
    const billContent = `
================================
       CONTA DA MESA ${tableNumber}
================================

${table.orders.map(item => 
  `${item.quantity}x ${item.productName}
                    R$ ${item.subtotal.toFixed(2)}`
).join('\n\n')}

--------------------------------
Total: R$ ${finalTotal.toFixed(2)}
================================
    `;
    
    console.log('Imprimindo conta:', billContent);
    toast.success('Conta impressa com sucesso!');
  };

  const handleSimplePayment = (paymentMethod: PaymentMethod) => {
    if (!table.orders.length) {
      toast.error('Mesa sem pedidos');
      return;
    }

    completeTableSale(tableNumber, paymentMethod, 0, 'value'); // Sem desconto
    onPayment(tableNumber);
    toast.success(`Pagamento ${paymentMethod} realizado - Mesa ${tableNumber} liberada`);
  };

  const handleSplitPayment = (payments: Array<{method: PaymentMethod, amount: number}>, shouldPrint: boolean) => {
    if (!table.orders.length) {
      toast.error('Mesa sem pedidos');
      return;
    }

    if (shouldPrint) {
      handlePrintBill();
    }

    completeTableSaleWithSplit(tableNumber, payments, 0, 'value'); // Sem desconto
    setShowSplitDialog(false);
    onPayment(tableNumber);
    toast.success(`Pagamento dividido realizado - Mesa ${tableNumber} liberada`);
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-white border-green-200">
          <DialogHeader>
            <DialogTitle className="text-green-800 text-xl">Conta da Mesa {tableNumber}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Items */}
            <Card className="border-green-200">
              <CardContent className="p-4 bg-green-50">
                <h3 className="font-semibold mb-4 text-green-800">Itens do Pedido</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {table.orders.map(item => (
                    <div key={item.productId} className="flex justify-between items-center bg-white p-3 rounded border border-green-100">
                      <div>
                        <span className="font-medium text-green-800">{item.quantity}x {item.productName}</span>
                        <div className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</div>
                      </div>
                      <span className="font-bold text-green-600">R$ {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Total Summary */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between font-bold text-2xl">
                <span className="text-green-800">Total:</span>
                <span className="text-green-600">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div>
              <h3 className="text-green-800 font-medium mb-3">Pagamento Individual</h3>
              <QuickPaymentButtons 
                onPaymentSelect={handleSimplePayment}
                className="mb-4"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handlePrintBill} 
                variant="outline" 
                className="w-full border-green-300 text-green-700 hover:bg-green-50 h-12"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir Conta
              </Button>
              
              <Button 
                onClick={() => setShowSplitDialog(true)} 
                variant="outline" 
                className="w-full border-green-300 text-green-700 hover:bg-green-50 h-12"
              >
                <Split className="w-5 h-5 mr-2" />
                Dividir Conta [Enter]
              </Button>
              
              <Button 
                onClick={onClose} 
                variant="outline" 
                className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 h-12"
              >
                Cancelar [Esc]
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SplitPaymentDialog
        isOpen={showSplitDialog}
        onClose={() => setShowSplitDialog(false)}
        totalAmount={finalTotal}
        onConfirm={handleSplitPayment}
      />
    </>
  );
};

export default TableBillDialog;
