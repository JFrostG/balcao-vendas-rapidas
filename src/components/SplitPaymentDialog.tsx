
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentMethod } from '../types';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SplitPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (payments: Array<{method: PaymentMethod, amount: number}>) => void;
}

interface PaymentSplit {
  id: string;
  method: PaymentMethod;
  amount: number;
}

const SplitPaymentDialog = ({ isOpen, onClose, totalAmount, onConfirm }: SplitPaymentDialogProps) => {
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: '1', method: 'dinheiro', amount: 0 }
  ]);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = totalAmount - totalPaid;

  const addPayment = () => {
    const newPayment: PaymentSplit = {
      id: Date.now().toString(),
      method: 'dinheiro',
      amount: 0
    };
    setPayments([...payments, newPayment]);
  };

  const removePayment = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const updatePayment = (id: string, field: keyof PaymentSplit, value: any) => {
    setPayments(payments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    ));
  };

  const handleConfirm = () => {
    if (remaining > 0.01) {
      toast.error(`Ainda falta pagar R$ ${remaining.toFixed(2)}`);
      return;
    }

    if (remaining < -0.01) {
      toast.error(`Valor pago excede o total em R$ ${Math.abs(remaining).toFixed(2)}`);
      return;
    }

    const validPayments = payments.filter(p => p.amount > 0);
    if (validPayments.length === 0) {
      toast.error('Adicione pelo menos uma forma de pagamento');
      return;
    }

    onConfirm(validPayments);
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'dinheiro': return 'Dinheiro';
      case 'debito': return 'Cartão Débito';
      case 'credito': return 'Cartão Crédito';
      case 'pix': return 'PIX';
      case 'cortesia': return 'Cortesia';
      default: return method;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dividir Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded">
            <div className="flex justify-between font-semibold">
              <span>Total da Conta:</span>
              <span>R$ {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {payments.map((payment, index) => (
              <div key={payment.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Forma {index + 1}</Label>
                  <Select 
                    value={payment.method} 
                    onValueChange={(value) => updatePayment(payment.id, 'method', value as PaymentMethod)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="debito">Cartão Débito</SelectItem>
                      <SelectItem value="credito">Cartão Crédito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cortesia">Cortesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    type="number"
                    value={payment.amount}
                    onChange={(e) => updatePayment(payment.id, 'amount', Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removePayment(payment.id)}
                  disabled={payments.length === 1}
                  className="h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button 
            type="button" 
            variant="outline" 
            onClick={addPayment}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Forma de Pagamento
          </Button>

          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span>Total Pago:</span>
              <span>R$ {totalPaid.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between font-bold ${remaining > 0 ? 'text-red-600' : remaining < 0 ? 'text-orange-600' : 'text-green-600'}`}>
              <span>{remaining > 0 ? 'Falta:' : remaining < 0 ? 'Excesso:' : 'Pago:'}</span>
              <span>R$ {Math.abs(remaining).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleConfirm} 
              className="w-full"
              disabled={remaining > 0.01 || remaining < -0.01}
            >
              Confirmar Pagamento
            </Button>
            <Button onClick={onClose} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SplitPaymentDialog;
