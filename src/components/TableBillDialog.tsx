
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '../store/useStore';
import { PaymentMethod } from '../types';
import { CreditCard, Printer, Split } from 'lucide-react';
import { toast } from 'sonner';
import SplitPaymentDialog from './SplitPaymentDialog';

interface TableBillDialogProps {
  tableNumber: number;
  onClose: () => void;
  onPayment: (tableNumber: number) => void;
}

const TableBillDialog = ({ tableNumber, onClose, onPayment }: TableBillDialogProps) => {
  const { tables, completeTableSale, completeTableSaleWithSplit } = useStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  
  const table = tables.find(t => t.id === tableNumber);
  
  if (!table) return null;

  const cartTotal = table.total;
  const discountAmount = discountType === 'percentage' ? (cartTotal * discount) / 100 : discount;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const handlePrintBill = () => {
    const billContent = `
CONTA DA MESA ${tableNumber}
================================

${table.orders.map(item => 
  `${item.quantity}x ${item.productName} - R$ ${item.subtotal.toFixed(2)}`
).join('\n')}

--------------------------------
Subtotal: R$ ${cartTotal.toFixed(2)}
${discount > 0 ? `Desconto: R$ ${discountAmount.toFixed(2)}\n` : ''}Total: R$ ${finalTotal.toFixed(2)}
================================
    `;
    
    console.log('Imprimindo conta:', billContent);
    toast.success('Conta impressa com sucesso!');
  };

  const handleSimplePayment = () => {
    if (!table.orders.length) {
      toast.error('Mesa sem pedidos');
      return;
    }

    completeTableSale(tableNumber, paymentMethod, discount, discountType);
    onPayment(tableNumber);
  };

  const handleSplitPayment = (payments: Array<{method: PaymentMethod, amount: number}>) => {
    if (!table.orders.length) {
      toast.error('Mesa sem pedidos');
      return;
    }

    completeTableSaleWithSplit(tableNumber, payments, discount, discountType);
    setShowSplitDialog(false);
    onPayment(tableNumber);
    toast.success(`Pagamento dividido realizado - Mesa ${tableNumber} liberada`);
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conta da Mesa {tableNumber}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Items */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                <div className="space-y-2">
                  {table.orders.map(item => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>R$ {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Discount */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Desconto</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'value' | 'percentage')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">R$</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method for Simple Payment */}
            <div>
              <Label>Forma de Pagamento (Simples)</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Button onClick={handlePrintBill} variant="outline" className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Conta
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleSimplePayment} className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar Simples
                </Button>
                <Button onClick={() => setShowSplitDialog(true)} variant="outline" className="w-full">
                  <Split className="w-4 h-4 mr-2" />
                  Dividir Conta
                </Button>
              </div>
              
              <Button onClick={onClose} variant="outline" className="w-full">
                Cancelar
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
