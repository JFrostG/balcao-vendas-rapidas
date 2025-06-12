
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentMethod } from '../types';
import { Printer, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SplitPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (payments: Array<{method: PaymentMethod, amount: number}>, shouldPrint: boolean) => void;
}

const SplitPaymentDialog = ({ isOpen, onClose, totalAmount, onConfirm }: SplitPaymentDialogProps) => {
  const [payments, setPayments] = useState<{[key in PaymentMethod]: number}>({
    dinheiro: 0,
    debito: 0,
    credito: 0,
    pix: 0,
    cortesia: 0
  });
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<Array<{method: PaymentMethod, amount: number}>>([]);
  
  const inputRefs = useRef<{[key in PaymentMethod]: HTMLInputElement | null}>({
    dinheiro: null,
    debito: null,
    credito: null,
    pix: null,
    cortesia: null
  });

  const paymentMethods: Array<{key: PaymentMethod, label: string, color: string}> = [
    { key: 'dinheiro', label: 'Dinheiro', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
    { key: 'debito', label: 'Cartão Débito', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
    { key: 'credito', label: 'Cartão Crédito', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
    { key: 'pix', label: 'PIX', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
    { key: 'cortesia', label: 'Cortesia', color: 'bg-green-100 hover:bg-green-200 border-green-300' }
  ];

  const totalPaid = Object.values(payments).reduce((sum, amount) => sum + amount, 0);
  const remaining = totalAmount - totalPaid;

  const handlePaymentMethodClick = (method: PaymentMethod) => {
    const newPayments = { ...payments };
    const currentTotal = Object.values(newPayments).reduce((sum, amount) => sum + amount, 0);
    const remainingAmount = totalAmount - currentTotal + newPayments[method];
    
    newPayments[method] = remainingAmount;
    setPayments(newPayments);
    
    // Focus on the input field
    setTimeout(() => {
      inputRefs.current[method]?.focus();
      inputRefs.current[method]?.select();
    }, 100);
  };

  const handleAmountChange = (method: PaymentMethod, value: number) => {
    setPayments(prev => ({
      ...prev,
      [method]: Math.max(0, value)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, method: PaymentMethod) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
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

    const validPayments = Object.entries(payments)
      .filter(([_, amount]) => amount > 0)
      .map(([method, amount]) => ({ method: method as PaymentMethod, amount }));

    if (validPayments.length === 0) {
      toast.error('Adicione pelo menos uma forma de pagamento');
      return;
    }

    setPendingPayments(validPayments);
    setShowPrintDialog(true);
  };

  const handleFinalConfirm = (shouldPrint: boolean) => {
    onConfirm(pendingPayments, shouldPrint);
    setShowPrintDialog(false);
  };

  useEffect(() => {
    if (isOpen) {
      setPayments({
        dinheiro: 0,
        debito: 0,
        credito: 0,
        pix: 0,
        cortesia: 0
      });
    }
  }, [isOpen]);

  if (showPrintDialog) {
    return (
      <Dialog open onOpenChange={() => setShowPrintDialog(false)}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-green-800">Imprimir Conta?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-center text-gray-700">
              Deseja imprimir a conta antes de finalizar o pagamento?
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleFinalConfirm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Sim, Imprimir
              </Button>
              <Button 
                onClick={() => handleFinalConfirm(false)}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Não Imprimir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white border-green-200">
        <DialogHeader>
          <DialogTitle className="text-green-800 text-xl">Dividir Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Total */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-green-800">Total da Conta:</span>
              <span className="text-xl font-bold text-green-600">R$ {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="space-y-3">
            <Label className="text-green-800 font-medium">Formas de Pagamento</Label>
            <div className="grid gap-3">
              {paymentMethods.map((method) => (
                <div key={method.key} className="grid grid-cols-2 gap-3 items-center">
                  {/* Payment Method Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePaymentMethodClick(method.key)}
                    className={`${method.color} text-green-800 font-medium h-12 justify-start transition-all`}
                  >
                    {method.label}
                  </Button>
                  
                  {/* Amount Input */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-medium">
                      R$
                    </span>
                    <Input
                      ref={(el) => { inputRefs.current[method.key] = el; }}
                      type="number"
                      value={payments[method.key] || ''}
                      onChange={(e) => handleAmountChange(method.key, Number(e.target.value))}
                      onKeyDown={(e) => handleKeyDown(e, method.key)}
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      className="pl-10 h-12 border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3 border-t border-green-200 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pago:</span>
                  <span className="font-medium">R$ {totalPaid.toFixed(2)}</span>
                </div>
              </div>
              <div className={`text-right ${remaining > 0 ? 'text-red-600' : remaining < 0 ? 'text-orange-600' : 'text-green-600'}`}>
                <div className="font-bold text-lg">
                  {remaining > 0 ? 'Falta:' : remaining < 0 ? 'Excesso:' : 'Completo:'}
                </div>
                <div className="text-xl font-bold">
                  R$ {Math.abs(remaining).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleConfirm} 
              disabled={remaining > 0.01 || remaining < -0.01}
              className="bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium"
            >
              <Check className="w-5 h-5 mr-2" />
              Confirmar
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="border-green-300 text-green-700 hover:bg-green-50 h-12 text-base"
            >
              Cancelar
            </Button>
          </div>
          
          <div className="text-xs text-center text-gray-500 border-t border-green-100 pt-3">
            💡 Dica: Clique na forma de pagamento para receber o valor total • Pressione Enter para confirmar
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SplitPaymentDialog;
