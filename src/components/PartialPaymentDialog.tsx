
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentMethod } from '../types';
import { toast } from 'sonner';
import QuickPaymentButtons from './QuickPaymentButtons';

interface PartialPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  tableTotal: number;
  onConfirm: (paymentMethod: PaymentMethod, amount: number) => void;
}

const PartialPaymentDialog = ({ 
  isOpen, 
  onClose, 
  tableNumber, 
  tableTotal, 
  onConfirm 
}: PartialPaymentDialogProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');

  const handleConfirm = () => {
    if (amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    if (amount > tableTotal) {
      toast.error('Valor não pode ser maior que o total da conta');
      return;
    }

    onConfirm(paymentMethod, amount);
    setAmount(0);
    onClose();
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const getTableName = () => {
    return tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento Parcial - {getTableName()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total da Conta:</span>
              <span className="text-xl font-bold text-blue-600">
                R$ {tableTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="amount">Valor do Pagamento Parcial</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                id="amount"
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="0"
                max={tableTotal}
                step="0.01"
                placeholder="0,00"
                className="pl-10"
              />
            </div>
            <p className="text-sm text-gray-500">
              Restante após pagamento: R$ {Math.max(0, tableTotal - amount).toFixed(2)}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Forma de Pagamento</Label>
            <QuickPaymentButtons 
              onPaymentSelect={handlePaymentSelect}
              className="grid-cols-2"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleConfirm}
              disabled={amount <= 0 || amount > tableTotal}
              className="flex-1"
            >
              Confirmar Pagamento
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartialPaymentDialog;
