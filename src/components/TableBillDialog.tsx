
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTableStore } from '../store/tableStore';
import { PaymentMethod } from '../types';
import { toast } from 'sonner';
import SplitPaymentDialog from './SplitPaymentDialog';
import PartialPaymentDialog from './PartialPaymentDialog';
import QuickPaymentButtons from './QuickPaymentButtons';

interface TableBillDialogProps {
  tableNumber: number;
  onClose: () => void;
  onPayment: (tableNumber: number) => void;
}

const TableBillDialog = ({ tableNumber, onClose, onPayment }: TableBillDialogProps) => {
  const { tables, completeTableSale, completeTableSaleWithSplit, completePartialPayment } = useTableStore();
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showPartialDialog, setShowPartialDialog] = useState(false);

  const table = tables.find(t => t.id === tableNumber);

  if (!table) {
    return null;
  }

  const handlePaymentSelect = (method: PaymentMethod) => {
    completeTableSale(tableNumber, method);
    toast.success(`Pagamento realizado - ${getTableName()} liberada`);
    onPayment(tableNumber);
  };

  const handleSplitPayment = (payments: Array<{method: PaymentMethod, amount: number}>, shouldPrint: boolean) => {
    completeTableSaleWithSplit(tableNumber, payments);
    if (shouldPrint) {
      // Aqui seria implementada a impressão
      console.log('Imprimindo conta...');
    }
    toast.success(`Pagamento dividido realizado - ${getTableName()} liberada`);
    setShowSplitDialog(false);
    onPayment(tableNumber);
  };

  const handlePartialPayment = (paymentMethod: PaymentMethod, amount: number) => {
    completePartialPayment(tableNumber, paymentMethod, amount);
    const remaining = table.total - amount;
    if (remaining > 0) {
      toast.success(`Pagamento parcial de R$ ${amount.toFixed(2)} realizado. Restante: R$ ${remaining.toFixed(2)}`);
    } else {
      toast.success(`Pagamento realizado - ${getTableName()} liberada`);
      onPayment(tableNumber);
    }
  };

  const getTableName = () => {
    return tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`;
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conta - {getTableName()}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Items */}
            <div className="space-y-3">
              <h3 className="font-semibold">Itens do Pedido:</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {table.orders.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">{item.quantity}x {item.productName}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (R$ {item.price.toFixed(2)} cada)
                      </span>
                    </div>
                    <span className="font-medium">R$ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  R$ {table.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-4">
              <h3 className="font-semibold">Opções de Pagamento:</h3>
              
              {/* Quick Payment */}
              <div>
                <h4 className="text-sm font-medium mb-2">Pagamento Total:</h4>
                <QuickPaymentButtons onPaymentSelect={handlePaymentSelect} />
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => setShowSplitDialog(true)}
                  variant="outline"
                  className="h-12"
                >
                  Dividir Pagamento
                </Button>
                <Button 
                  onClick={() => setShowPartialDialog(true)}
                  variant="outline"
                  className="h-12"
                >
                  Pagamento Parcial
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SplitPaymentDialog
        isOpen={showSplitDialog}
        onClose={() => setShowSplitDialog(false)}
        totalAmount={table.total}
        onConfirm={handleSplitPayment}
      />

      <PartialPaymentDialog
        isOpen={showPartialDialog}
        onClose={() => setShowPartialDialog(false)}
        tableNumber={tableNumber}
        tableTotal={table.total}
        onConfirm={handlePartialPayment}
      />
    </>
  );
};

export default TableBillDialog;
